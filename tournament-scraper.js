const axios = require('axios');
const cheerio = require('cheerio');
const AuthFetcherHTTP = require('./auth-fetcher-http');

class TournamentParticipantsScraper {
  constructor(tournamentId, year) {
    this.tournamentId = tournamentId;
    this.year = year;
    this.sessionId = null;
    this.cookie = null;
  }

  async initialize() {
    console.log('Initializing authentication...');
    const authFetcher = new AuthFetcherHTTP(this.tournamentId);
    const auth = await authFetcher.call();
    this.sessionId = auth.twSessionId;
    this.cookie = auth.cookie;
  }

  async call() {
    if (!this.sessionId || !this.cookie) {
      await this.initialize();
    }

    const teams = await this.getTeams();
    const results = [];
    
    for (const team of teams) {
      try {
        const document = await this.getTeamResultsDocument(team.value);
        const teamResults = this.extractResultsData(document, team.name);
        results.push(...teamResults);
      } catch (error) {
        console.error(`Error processing team ${team.name}:`, error);
      }
    }
    
    console.log('Scraped results:', results);
    return results;
  }

  async getTeams() {
    try {
      const url = `https://www.trackwrestling.com/predefinedtournaments/TeamResults.jsp?twSessionId=${this.sessionId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Cookie': this.cookie,
          'User-Agent': 'curl/8.7.1',
          'Accept': '*/*'
        },
        httpsAgent: new (require('https')).Agent({
          rejectUnauthorized: false
        })
      });

      const $ = cheerio.load(response.data);
      console.log('Loaded teams page');
      
      const teams = [];
      $('option[value]').each((index, element) => {
        const value = $(element).attr('value');
        const name = $(element).text().trim();
        
        if (value && value !== '') {
          teams.push({
            value: value,
            name: name
          });
        }
      });

      return teams.filter(team => team.value !== '');
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  extractResultsData(document, teamName) {
    const $ = cheerio.load(document);
    const sections = [];
    
    $('.tw-list section').each((index, element) => {
      const placementText = $(element).find('> p').first().text().trim();
      const titleText = $(element).find('> h2').first().text().trim();
      
      // Look for additional data that might contain grade information
      const fullSectionText = $(element).text().trim();
      const allParagraphs = $(element).find('p').map((i, p) => $(p).text().trim()).get();
      
      if (placementText && titleText) {
        sections.push({
          titleText: titleText,
          placementText: placementText,
          fullText: fullSectionText,
          allParagraphs: allParagraphs
        });
      }
    });

    const pattern = /^(.*) \((\d+-\d+)\) place(?:d)? (\w+(?:\s\w+)?) and scored (\d+\.\d+) team points\./;
    const results = [];

    sections.forEach(result => {
      const match = result.placementText.match(pattern);
      if (match) {
        const [, name, record, place, points] = match;
        const metaData = this.parseDivisionAndWeight(result.titleText);
        const nameParts = name.trim().split(' ');
        
        // Extract grade information from available data
        const gradeInfo = this.extractGradeInfo(result);
        
        // Debug logging for grade extraction
        if (gradeInfo) {
          console.log(`✅ Found grade "${gradeInfo}" for ${name}`);
        } else {
          console.log(`⚠️  No grade found for ${name}. Title: "${result.titleText}", Full: "${result.fullText.substring(0, 100)}..."`);
        }
        
        results.push({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          wins: parseInt(record.split('-')[0]) || 0,
          losses: parseInt(record.split('-')[1]) || 0,
          place: place,
          pointsScored: parseFloat(points) || 0,
          team: teamName,
          year: this.year,
          division: metaData?.division || '',
          weightClass: metaData?.weightClass || '',
          grade: gradeInfo || ''
        });
      } else {
        console.log('No match found for placement text:', result.placementText);
      }
    });

    return results;
  }

  async getTeamResultsDocument(teamId) {
    try {
      const url = `https://www.trackwrestling.com/predefinedtournaments/TeamResults.jsp?newSession=false&TIM=${Date.now()}&pageName=%2Fpredefinedtournaments%2FTeamResults.jsp&twSessionId=${this.sessionId}`;
      
      const headers = {
        'accept': '*/*',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': this.cookie,
        'user-agent': 'curl/8.7.1'
      };

      const formData = new URLSearchParams();
      formData.append('teamBox', teamId);

      const response = await axios.post(url, formData, {
        headers: headers,
        httpsAgent: new (require('https')).Agent({
          rejectUnauthorized: false
        })
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching team results document:', error);
      throw error;
    }
  }

  parseDivisionAndWeight(str) {
    // Pattern 1: "1A 125" or "D1-125"
    let match = str.match(/^(\d+A|D\d)[ -]?(\d+)$/);
    if (match) {
      return {
        division: match[1],
        weightClass: match[2]
      };
    }

    // Pattern 2: "125-A1"
    match = str.match(/^(\d+)-([A-Z]\d)$/);
    if (match) {
      return {
        division: match[2],
        weightClass: match[1]
      };
    }

    return null;
  }

  extractGradeInfo(sectionData) {
    // Look for grade information in various formats
    const { titleText, placementText, fullText, allParagraphs } = sectionData;
    
    // Common grade patterns to look for
    const gradePatterns = [
      // Numeric grades: "9th", "10th", "11th", "12th"
      /(\d+)(?:st|nd|rd|th)[\s\-]?(?:grade)?/i,
      // Letter grades: "Fr", "So", "Jr", "Sr", "Freshman", "Sophomore", etc.
      /(freshman|fr|sophomore|so|junior|jr|senior|sr)(?:\s+grade)?/i,
      // Grade in parentheses: "(12th)", "(Sr)", etc.
      /\(([^)]*(?:grade|fr|so|jr|sr|\d+(?:st|nd|rd|th)))\)/i
    ];
    
    // Search in title text first (most likely location)
    for (const pattern of gradePatterns) {
      let match = titleText.match(pattern);
      if (match) {
        return this.normalizeGrade(match[1]);
      }
    }
    
    // Search in all paragraphs
    for (const paragraph of allParagraphs) {
      for (const pattern of gradePatterns) {
        let match = paragraph.match(pattern);
        if (match) {
          return this.normalizeGrade(match[1]);
        }
      }
    }
    
    // Search in full section text as last resort
    for (const pattern of gradePatterns) {
      let match = fullText.match(pattern);
      if (match) {
        return this.normalizeGrade(match[1]);
      }
    }
    
    return null;
  }

  normalizeGrade(gradeString) {
    if (!gradeString) return null;
    
    const grade = gradeString.toLowerCase().trim();
    
    // Convert common variations to standard format
    const gradeMap = {
      'freshman': 'Fr',
      'fr': 'Fr',
      'sophomore': 'So', 
      'so': 'So',
      'junior': 'Jr',
      'jr': 'Jr',
      'senior': 'Sr',
      'sr': 'Sr',
      '9': '9th',
      '10': '10th',
      '11': '11th', 
      '12': '12th'
    };
    
    // Check if it's in our mapping
    if (gradeMap[grade]) {
      return gradeMap[grade];
    }
    
    // If it already looks like a proper grade (9th, 10th, etc.), return as-is
    if (grade.match(/^\d+(st|nd|rd|th)$/)) {
      return grade.charAt(0).toUpperCase() + grade.slice(1);
    }
    
    // Return the original if we can't normalize it
    return gradeString;
  }
}

module.exports = TournamentParticipantsScraper;

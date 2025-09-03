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
      
      if (placementText && titleText) {
        sections.push({
          titleText: titleText,
          placementText: placementText
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
          grade: ''
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
}

module.exports = TournamentParticipantsScraper;

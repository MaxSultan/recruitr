const cheerio = require('cheerio');

/**
 * Match Parser for TrackWrestling
 * 
 * Handles parsing of match data from different tournament types:
 * - Individual tournaments
 * - Dual meets
 * - Team tournaments
 */
class MatchParser {
  constructor() {
    this.matchPatterns = {
      // Common patterns for different match result types
      fall: /fall|pin|pinned/i,
      technical: /tech|technical|tf/i,
      major: /major/i,
      decision: /decision|dec/i
    };
  }

  /**
   * Parse matches from a tournament page
   */
  parseTournamentMatches(html, sourceUrl) {
    const $ = cheerio.load(html);
    const matches = [];

    // Method 1: Look for match tables with specific structure
    $('table').each((tableIndex, table) => {
      const $table = $(table);
      const rows = $table.find('tr');
      
      // Check if this looks like a match results table
      if (this.isMatchTable($table)) {
        rows.each((rowIndex, row) => {
          const match = this.parseMatchTableRow($(row), sourceUrl);
          if (match) {
            matches.push(match);
          }
        });
      }
    });

    // Method 2: Look for match links and process individually
    $('a[href*="matches/view.jsp"], a[href*="match.jsp"]').each((index, link) => {
      const $link = $(link);
      const matchUrl = this.resolveUrl($link.attr('href'), sourceUrl);
      
      // Add to queue for individual processing
      matches.push({
        type: 'individual_match',
        url: matchUrl,
        sourceUrl
      });
    });

    // Method 3: Look for embedded match data in divs
    $('.match-result, .match-data, .wrestling-match').each((index, element) => {
      const match = this.parseEmbeddedMatch($(element), sourceUrl);
      if (match) {
        matches.push(match);
      }
    });

    return matches;
  }

  /**
   * Parse matches from a dual meet page
   */
  parseDualMeetMatches(html, sourceUrl) {
    const $ = cheerio.load(html);
    const matches = [];

    // Dual meets typically have a simpler structure
    $('.dual-match, .match-row, tr').each((index, element) => {
      const $element = $(element);
      
      // Look for weight class indicators
      const weightText = $element.text();
      const weightMatch = weightText.match(/(\d+)\s*lbs?/i);
      
      if (weightMatch) {
        const match = this.parseDualMatchRow($element, sourceUrl);
        if (match) {
          matches.push(match);
        }
      }
    });

    return matches;
  }

  /**
   * Check if a table contains match data
   */
  isMatchTable($table) {
    const tableText = $table.text().toLowerCase();
    const headers = $table.find('th').text().toLowerCase();
    
    // Look for match-related keywords
    const matchKeywords = [
      'weight', 'wrestler', 'opponent', 'result', 'score', 'time',
      'fall', 'pin', 'decision', 'major', 'technical'
    ];
    
    const keywordCount = matchKeywords.filter(keyword => 
      tableText.includes(keyword) || headers.includes(keyword)
    ).length;
    
    // If we find at least 3 match-related keywords, it's likely a match table
    return keywordCount >= 3;
  }

  /**
   * Parse a single match row from a table
   */
  parseMatchTableRow($row, sourceUrl) {
    const cells = $row.find('td');
    if (cells.length < 4) return null;

    try {
      // Different table structures may have different column orders
      // Try to identify columns by content
      let weight = null;
      let wrestler1 = null;
      let wrestler2 = null;
      let result = null;
      let score = null;

      cells.each((index, cell) => {
        const $cell = $(cell);
        const text = $cell.text().trim();
        
        // Identify weight class
        const weightMatch = text.match(/(\d+)\s*lbs?/i);
        if (weightMatch && !weight) {
          weight = parseInt(weightMatch[1]);
          return;
        }
        
        // Identify result/score
        if (this.isMatchResult(text)) {
          result = this.parseMatchResult(text);
          score = this.extractScore(text);
          return;
        }
        
        // Identify wrestler names (look for name patterns)
        if (this.isWrestlerName(text)) {
          if (!wrestler1) {
            wrestler1 = this.cleanWrestlerName(text);
          } else if (!wrestler2) {
            wrestler2 = this.cleanWrestlerName(text);
          }
        }
      });

      if (!wrestler1 || !wrestler2 || !result) {
        return null;
      }

      // Determine winner and loser based on result
      const { winner, loser } = this.determineWinnerLoser(wrestler1, wrestler2, result, score);

      return {
        winner,
        loser,
        result,
        weight,
        score,
        date: this.extractDateFromUrl(sourceUrl),
        sourceUrl,
        tournamentType: this.determineTournamentType(sourceUrl)
      };

    } catch (error) {
      console.error('Error parsing match row:', error);
      return null;
    }
  }

  /**
   * Parse embedded match data from divs
   */
  parseEmbeddedMatch($element, sourceUrl) {
    const text = $element.text();
    
    // Look for match patterns in the text
    const matchPattern = /(\w+\s+\w+).*?vs\.?\s*(\w+\s+\w+).*?(fall|pin|tech|major|decision)/i;
    const match = text.match(matchPattern);
    
    if (!match) return null;
    
    const wrestler1 = this.cleanWrestlerName(match[1]);
    const wrestler2 = this.cleanWrestlerName(match[2]);
    const result = this.parseMatchResult(match[3]);
    
    // Extract weight if present
    const weightMatch = text.match(/(\d+)\s*lbs?/i);
    const weight = weightMatch ? parseInt(weightMatch[1]) : null;
    
    // Determine winner (simplified - assumes first wrestler won)
    // In practice, you'd need more context to determine the actual winner
    const { winner, loser } = this.determineWinnerLoser(wrestler1, wrestler2, result, null);
    
    return {
      winner,
      loser,
      result,
      weight,
      date: this.extractDateFromUrl(sourceUrl),
      sourceUrl,
      tournamentType: this.determineTournamentType(sourceUrl)
    };
  }

  /**
   * Parse dual meet match row
   */
  parseDualMatchRow($row, sourceUrl) {
    // Similar to parseMatchTableRow but optimized for dual meet structure
    return this.parseMatchTableRow($row, sourceUrl);
  }

  /**
   * Parse individual match page
   */
  async parseIndividualMatch(html, matchUrl) {
    const $ = cheerio.load(html);
    
    // Extract match data from individual match page
    // This would need to be customized based on TrackWrestling's match page structure
    const matchData = {
      url: matchUrl,
      sourceUrl: matchUrl
    };
    
    // Look for wrestler names
    const wrestlers = $('.wrestler-name, .athlete-name').map((i, el) => $(el).text().trim()).get();
    if (wrestlers.length >= 2) {
      matchData.wrestler1 = this.cleanWrestlerName(wrestlers[0]);
      matchData.wrestler2 = this.cleanWrestlerName(wrestlers[1]);
    }
    
    // Look for result
    const resultText = $('.match-result, .result').text().trim();
    if (resultText) {
      matchData.result = this.parseMatchResult(resultText);
    }
    
    // Look for weight
    const weightText = $('.weight-class, .weight').text().trim();
    const weightMatch = weightText.match(/(\d+)\s*lbs?/i);
    if (weightMatch) {
      matchData.weight = parseInt(weightMatch[1]);
    }
    
    // Look for date
    const dateText = $('.match-date, .date').text().trim();
    if (dateText) {
      matchData.date = new Date(dateText);
    }
    
    return matchData;
  }

  /**
   * Utility methods
   */
  isMatchResult(text) {
    const lowerText = text.toLowerCase();
    return Object.keys(this.matchPatterns).some(pattern => 
      this.matchPatterns[pattern].test(lowerText)
    );
  }

  parseMatchResult(text) {
    const lowerText = text.toLowerCase();
    
    if (this.matchPatterns.fall.test(lowerText)) return 'fall';
    if (this.matchPatterns.technical.test(lowerText)) return 'technical-fall';
    if (this.matchPatterns.major.test(lowerText)) return 'major-decision';
    return 'decision';
  }

  isWrestlerName(text) {
    // Simple heuristic: names typically have 2-4 words, start with capital letters
    const words = text.trim().split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    
    return words.every(word => 
      word.length > 0 && 
      word[0] === word[0].toUpperCase() &&
      /^[a-zA-Z\s\.'-]+$/.test(word)
    );
  }

  cleanWrestlerName(name) {
    return name
      .replace(/\([^)]*\)/g, '') // Remove parentheses content
      .replace(/\d+/g, '') // Remove numbers
      .replace(/lbs?/gi, '') // Remove weight indicators
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  extractScore(text) {
    // Look for score patterns like "15-3", "6-2", etc.
    const scoreMatch = text.match(/(\d+)-(\d+)/);
    return scoreMatch ? {
      winner: parseInt(scoreMatch[1]),
      loser: parseInt(scoreMatch[2])
    } : null;
  }

  determineWinnerLoser(wrestler1, wrestler2, result, score) {
    // This is a simplified implementation
    // In practice, you'd need more context to determine the actual winner
    // For now, assume wrestler1 is the winner
    // You might need to parse additional context like team scores or match order
    
    return {
      winner: wrestler1,
      loser: wrestler2
    };
  }

  extractDateFromUrl(url) {
    // Try to extract date from URL patterns
    const dateMatch = url.match(/(\d{4})[/-](\d{2})[/-](\d{2})/);
    if (dateMatch) {
      return new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
    }
    
    // Default to current date
    return new Date();
  }

  determineTournamentType(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('state')) return 'state';
    if (urlLower.includes('regional')) return 'regional';
    if (urlLower.includes('district')) return 'district';
    if (urlLower.includes('national')) return 'national';
    return 'local';
  }

  resolveUrl(href, baseUrl) {
    if (href.startsWith('http')) return href;
    if (href.startsWith('/')) return `https://www.trackwrestling.com${href}`;
    return `${baseUrl}/${href}`;
  }
}

module.exports = MatchParser;

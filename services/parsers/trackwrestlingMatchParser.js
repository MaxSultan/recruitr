/**
 * Parser for TrackWrestling match data
 * Single Responsibility: Parse match text into structured data
 */
class TrackWrestlingMatchParser {
  
  /**
   * Parse match text into structured match data
   * @param {string} matchText - Raw match text from TrackWrestling
   * @param {string} weightClass - Weight class for the match
   * @param {Date|null} eventDate - Date of the event (optional)
   * @returns {Object|null} Parsed match data or null if parsing fails
   */
  parseMatch(matchText, weightClass, eventDate = null) {
    try {
      if (!matchText || typeof matchText !== 'string') {
        return null;
      }

      // Clean up the text
      const cleanText = matchText.trim();
      
      // Skip empty or invalid matches
      if (!cleanText || cleanText.length < 10) {
        return null;
      }

      // Parse the match using regex
      const matchData = this.parseMatchText(cleanText);
      
      if (!matchData) {
        return null;
      }

      // Add weight class, event date, and return
      return {
        ...matchData,
        weightClass: weightClass,
        eventDate: eventDate,
        rawText: cleanText
      };
    } catch (error) {
      console.error('Error parsing match:', error);
      return null;
    }
  }

  /**
   * Parse match text using regex patterns
   * @param {string} text - Match text to parse
   * @returns {Object|null} Parsed match data
   */
  parseMatchText(text) {
    // Pattern for matches with tournament round
    // Example: "Cons. Semis - Logan McNally (Wasatch) over Adam Mitchell (Cedar Valley) (MD 9-1)"
    const roundPattern = /^(.+?)\s*-\s*(.+?)\s+over\s+(.+?)\s+\(([^)]+)\)$/;
    
    // Pattern for matches without tournament round - improved to handle nested parentheses
    // Example: "Aubrey Hastings (Cumberland HS) over Jillian Boncore (Alvirne) (Fall 3:47)"
    const simplePattern = /^(.+?)\s+over\s+(.+?)\s+\(([^)]+)\)$/;

    let match;
    let tournamentRound = null;

    // Try round pattern first
    match = text.match(roundPattern);
    if (match) {
      tournamentRound = match[1].trim();
      const winnerText = match[2].trim();
      const loserText = match[3].trim();
      const resultText = match[4].trim();
      
      return this.buildMatchData(tournamentRound, winnerText, loserText, resultText);
    }

    // Try simple pattern
    match = text.match(simplePattern);
    if (match) {
      const winnerText = match[1].trim();
      const loserText = match[2].trim();
      const resultText = match[3].trim();
      
      return this.buildMatchData(tournamentRound, winnerText, loserText, resultText);
    }

    // If no pattern matches, return null
    return null;
  }

  /**
   * Build match data object from parsed components
   * @param {string|null} tournamentRound - Tournament round
   * @param {string} winnerText - Winner text
   * @param {string} loserText - Loser text
   * @param {string} resultText - Result text
   * @returns {Object} Match data object
   */
  buildMatchData(tournamentRound, winnerText, loserText, resultText) {
    const winner = this.parseWrestler(winnerText);
    const loser = this.parseWrestler(loserText);
    const result = this.parseResult(resultText);

    return {
      tournamentRound: tournamentRound,
      winner: winner,
      loser: loser,
      result: result,
      matchType: this.determineMatchType(resultText)
    };
  }

  /**
   * Parse wrestler information from text
   * @param {string} wrestlerText - Wrestler text (e.g., "Aubrey Hastings (Cumberland HS)")
   * @returns {Object} Wrestler data
   */
  parseWrestler(wrestlerText) {
    // Pattern: "FirstName LastName (School Name)"
    const pattern = /^(.+?)\s+\((.+?)\)$/;
    const match = wrestlerText.match(pattern);
    
    if (match) {
      const fullName = match[1].trim();
      const school = match[2].trim();
      
      // Split name into first and last
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'Unknown'; // Ensure lastName is never empty
      
      return {
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        school: school
      };
    }
    
    // Fallback if pattern doesn't match
    return {
      firstName: wrestlerText,
      lastName: 'Unknown', // Ensure lastName is never empty
      fullName: wrestlerText,
      school: ''
    };
  }

  /**
   * Parse match result from text
   * @param {string} resultText - Result text (e.g., "Fall 3:47", "Dec 4-2", "MD 9-1", "TF 21-3 5:02")
   * @returns {Object} Result data
   */
  parseResult(resultText) {
    const result = resultText.trim().toUpperCase();
    
    // Fall
    if (result.startsWith('FALL')) {
      const timeMatch = result.match(/FALL\s+(\d+:\d+)/);
      return {
        type: 'fall',
        score: null,
        time: timeMatch ? timeMatch[1] : null,
        raw: resultText
      };
    }
    
    // Technical Fall
    if (result.startsWith('TF')) {
      const tfMatch = result.match(/TF\s+(\d+-\d+)\s+(\d+:\d+)/);
      return {
        type: 'technical-fall',
        score: tfMatch ? tfMatch[1] : null,
        time: tfMatch ? tfMatch[2] : null,
        raw: resultText
      };
    }
    
    // Major Decision
    if (result.startsWith('MD')) {
      const mdMatch = result.match(/MD\s+(\d+-\d+)/);
      return {
        type: 'major-decision',
        score: mdMatch ? mdMatch[1] : null,
        time: null,
        raw: resultText
      };
    }
    
    // Decision (handle both "Dec" and "DEC")
    if (result.startsWith('DEC') || resultText.toLowerCase().startsWith('dec')) {
      const decMatch = result.match(/(?:DEC|Dec)\s+(\d+-\d+)/i);
      return {
        type: 'decision',
        score: decMatch ? decMatch[1] : null,
        time: null,
        raw: resultText
      };
    }
    
    // Handle other common result types
    if (result.includes('FORFEIT') || result.includes('FOR')) {
      return {
        type: 'decision', // Treat forfeits as decisions
        score: null,
        time: null,
        raw: resultText
      };
    }
    
    if (result.includes('DEFAULT') || result.includes('DEF')) {
      return {
        type: 'decision', // Treat defaults as decisions
        score: null,
        time: null,
        raw: resultText
      };
    }
    
    // Default fallback - use decision instead of unknown
    return {
      type: 'decision',
      score: null,
      time: null,
      raw: resultText
    };
  }

  /**
   * Determine match type based on result
   * @param {string} resultText - Result text
   * @returns {string} Match type
   */
  determineMatchType(resultText) {
    const result = resultText.trim().toUpperCase();
    
    if (result.startsWith('FALL')) return 'fall';
    if (result.startsWith('TF')) return 'technical-fall';
    if (result.startsWith('MD')) return 'major-decision';
    if (result.startsWith('DEC')) return 'decision';
    if (result.includes('FORFEIT') || result.includes('FOR')) return 'decision';
    if (result.includes('DEFAULT') || result.includes('DEF')) return 'decision';
    
    return 'decision'; // Default to decision instead of unknown
  }

  /**
   * Parse multiple matches from an array of match texts
   * @param {Array} matchTexts - Array of match text objects
   * @returns {Array} Array of parsed match data
   */
  parseMatches(matchTexts) {
    const parsedMatches = [];
    
    matchTexts.forEach(matchTextObj => {
      const parsed = this.parseMatch(matchTextObj.matchText, matchTextObj.weightClass);
      if (parsed) {
        parsedMatches.push(parsed);
      }
    });
    
    return parsedMatches;
  }

  /**
   * Validate parsed match data
   * @param {Object} matchData - Parsed match data
   * @returns {boolean} True if valid
   */
  validateMatch(matchData) {
    if (!matchData) return false;
    
    // Check required fields
    if (!matchData.winner || !matchData.loser || !matchData.result) {
      return false;
    }
    
    // Check winner has name
    if (!matchData.winner.firstName || !matchData.winner.lastName) {
      return false;
    }
    
    // Check loser has name
    if (!matchData.loser.firstName || !matchData.loser.lastName) {
      return false;
    }
    
    // Check result has type
    if (!matchData.result.type) {
      return false;
    }
    
    return true;
  }
}

module.exports = new TrackWrestlingMatchParser();

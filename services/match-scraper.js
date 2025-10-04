const axios = require('axios');
const cheerio = require('cheerio');
const { performEloCalculation } = require('../utilities/perform-elo-calculation');
const { performGlickoCalculation } = require('../utilities/perform-glicko-calculation');
const { Athlete, Season, Match, SeasonRanking, RankingMatch } = require('../models');
const AuthFetcherHTTP = require('./auth-fetcher-http');

/**
 * Match Scraper for TrackWrestling
 * 
 * This scraper focuses on extracting individual match data from tournaments
 * and calculating ELO/Glicko ratings. It works with specific tournament IDs.
 */
class MatchScraper {
  constructor(tournamentId) {
    this.tournamentId = tournamentId;
    this.sessionId = null;
    this.cookie = null;
    this.processedMatches = new Set();
    this.athletesUpdated = 0;
    this.errors = 0;
  }

  /**
   * Main entry point - scrape matches from a tournament
   */
  async run() {
    try {
      console.log(`🚀 Starting match scraping for tournament ${this.tournamentId}...`);
      
      // Step 1: Initialize authentication
      await this.initializeAuth();
      
      // Step 2: Get tournament structure
      const teams = await this.getTeams();
      console.log(`Found ${teams.length} teams in tournament`);
      
      // Step 3: Process each team for match data
      for (const team of teams) {
        await this.processTeamMatches(team);
      }
      
      console.log('✅ Match scraping completed successfully');
      console.log(`📊 Summary: ${this.processedMatches.size} matches processed, ${this.athletesUpdated} athletes updated, ${this.errors} errors`);
      
    } catch (error) {
      console.error('❌ Match scraping failed:', error);
      throw error;
    }
  }

  /**
   * Initialize authentication
   */
  async initializeAuth() {
    console.log('🔐 Initializing authentication...');
    const authFetcher = new AuthFetcherHTTP(this.tournamentId);
    const auth = await authFetcher.call();
    this.sessionId = auth.twSessionId;
    this.cookie = auth.cookie;
    console.log('✅ Authentication successful');
  }

  /**
   * Get teams from tournament
   */
  async getTeams() {
    const url = `https://www.trackwrestling.com/predefinedtournaments/TeamResults.jsp?twSessionId=${this.sessionId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1',
        'Accept': '*/*'
      }
    });

    const $ = cheerio.load(response.data);
    const teams = [];

    // Extract team data
    $('select[name="teamId"] option').each((index, option) => {
      const $option = $(option);
      const value = $option.attr('value');
      const name = $option.text().trim();
      
      if (value && value !== '' && name && name !== 'Select Team') {
        teams.push({
          value: value,
          name: name
        });
      }
    });

    return teams;
  }

  /**
   * Process matches for a specific team
   */
  async processTeamMatches(team) {
    try {
      console.log(`🏆 Processing team: ${team.name}`);
      
      // Get team results page
      const url = `https://www.trackwrestling.com/predefinedtournaments/TeamResults.jsp?twSessionId=${this.sessionId}&teamId=${team.value}`;
      
      const response = await axios.get(url, {
        headers: {
          'Cookie': this.cookie,
          'User-Agent': 'curl/8.7.1'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Look for match data in the page
      await this.extractMatchesFromPage($, team);
      
    } catch (error) {
      console.error(`❌ Error processing team ${team.name}:`, error.message);
      this.errors++;
    }
  }

  /**
   * Extract matches from team results page
   */
  async extractMatchesFromPage($, team) {
    // Look for match tables or individual match data
    const matches = [];
    
    // Method 1: Look for individual wrestler results that might contain match info
    $('tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 4) {
        const match = this.parseMatchFromRow($row, team);
        if (match) {
          matches.push(match);
        }
      }
    });

    // Method 2: Look for match links
    $('a[href*="IndividualResults.jsp"], a[href*="matches"], a[href*="bout"]').each((index, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      const fullUrl = href.startsWith('http') ? href : `https://www.trackwrestling.com${href}`;
      
      // Queue for individual processing
      matches.push({
        type: 'individual_match',
        url: fullUrl,
        team: team
      });
    });

    console.log(`   Found ${matches.length} potential matches for ${team.name}`);

    // Process all matches
    for (const match of matches) {
      if (match.type === 'individual_match') {
        await this.processIndividualMatch(match.url, match.team);
      } else {
        await this.processMatch(match);
      }
    }
  }

  /**
   * Parse match data from a table row
   */
  parseMatchFromRow($row, team) {
    try {
      const cells = $row.find('td');
      if (cells.length < 4) return null;

      // Look for wrestler name, opponent, result pattern
      const wrestlerCell = $(cells[0]).text().trim();
      const opponentCell = $(cells[1]).text().trim();
      const resultCell = $(cells[2]).text().trim();
      const weightCell = $(cells[3]).text().trim();

      if (!wrestlerCell || !opponentCell || !resultCell) return null;

      // Parse weight
      const weightMatch = weightCell.match(/(\d+)/);
      const weight = weightMatch ? parseInt(weightMatch[1]) : null;

      // Parse result
      const result = this.parseMatchResult(resultCell);
      if (!result) return null;

      // Determine winner/loser
      const isWin = resultCell.toLowerCase().includes('win') || 
                   resultCell.toLowerCase().includes('w') ||
                   !resultCell.toLowerCase().includes('loss');

      return {
        winner: isWin ? wrestlerCell : opponentCell,
        loser: isWin ? opponentCell : wrestlerCell,
        result: result,
        weight: weight,
        date: new Date(), // Default to current date
        team: team.name,
        sourceUrl: `tournament_${this.tournamentId}_team_${team.value}`
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Process individual match from URL
   */
  async processIndividualMatch(matchUrl, team) {
    try {
      const response = await axios.get(matchUrl, {
        headers: {
          'Cookie': this.cookie,
          'User-Agent': 'curl/8.7.1'
        }
      });

      const $ = cheerio.load(response.data);
      const match = this.parseIndividualMatchPage($, matchUrl, team);
      
      if (match) {
        await this.processMatch(match);
      }

    } catch (error) {
      console.error(`❌ Error processing individual match ${matchUrl}:`, error.message);
      this.errors++;
    }
  }

  /**
   * Parse individual match page
   */
  parseIndividualMatchPage($, matchUrl, team) {
    // This would need to be customized based on TrackWrestling's individual match page structure
    // For now, return null as we're focusing on team results
    return null;
  }

  /**
   * Process a match and update ratings
   */
  async processMatch(matchData) {
    const matchHash = this.createMatchHash(matchData);
    
    if (this.processedMatches.has(matchHash)) {
      console.log('⏭️  Skipping duplicate match');
      return;
    }

    console.log(`🥊 Processing match: ${matchData.winner} vs ${matchData.loser} (${matchData.result})`);

    try {
      // Find or create athletes
      const winnerAthlete = await this.findOrCreateAthlete(matchData.winner);
      const loserAthlete = await this.findOrCreateAthlete(matchData.loser);

      // Get current ratings
      const winnerElo = winnerAthlete.elo || 1500;
      const loserElo = loserAthlete.elo || 1500;

      const winnerGlicko = {
        rating: Number(winnerAthlete.glickoRating) || 1500,
        rd: Number(winnerAthlete.glickoRd) || 200,
        volatility: Number(winnerAthlete.glickoVolatility) || 0.06
      };

      const loserGlicko = {
        rating: Number(loserAthlete.glickoRating) || 1500,
        rd: Number(loserAthlete.glickoRd) || 200,
        volatility: Number(loserAthlete.glickoVolatility) || 0.06
      };

      // Calculate new ratings
      const eloResult = performEloCalculation({
        winnerElo: winnerElo,
        loserElo: loserElo,
        result: matchData.result
      });

      const glickoResult = performGlickoCalculation(
        winnerGlicko,
        loserGlicko,
        matchData.result
      );

      // Save original match to database
      await Match.create({
        winnerId: winnerAthlete.id,
        loserId: loserAthlete.id,
        result: matchData.result,
        weight: matchData.weight,
        date: matchData.date,
        tournamentType: 'local',
        sourceUrl: matchData.sourceUrl,
        matchHash
      });

      // Process ranking matches for both athletes
      await this.processRankingMatch(winnerAthlete, loserAthlete, matchData, eloResult, glickoResult, matchHash, true);
      await this.processRankingMatch(loserAthlete, winnerAthlete, matchData, eloResult, glickoResult, matchHash, false);

      // Update athlete ratings
      await winnerAthlete.update({
        elo: Math.round(eloResult.winnerElo),
        glickoRating: glickoResult.winner.newRating,
        glickoRd: glickoResult.winner.newRd,
        glickoVolatility: glickoResult.winner.newVolatility,
        wins: winnerAthlete.wins + 1,
        lastMatchDate: matchData.date
      });

      await loserAthlete.update({
        elo: Math.round(eloResult.loserElo),
        glickoRating: glickoResult.loser.newRating,
        glickoRd: glickoResult.loser.newRd,
        glickoVolatility: glickoResult.loser.newVolatility,
        losses: loserAthlete.losses + 1,
        lastMatchDate: matchData.date
      });

      this.processedMatches.add(matchHash);
      this.athletesUpdated += 2;

      console.log(`✅ Updated ratings - Winner ELO: ${Math.round(eloResult.winnerElo)}, Loser ELO: ${Math.round(eloResult.loserElo)}`);

    } catch (error) {
      console.error('❌ Error processing match:', error);
      this.errors++;
    }
  }

  /**
   * Process ranking match for audit trail
   */
  async processRankingMatch(athlete, opponent, matchData, eloResult, glickoResult, matchHash, isWinner) {
    try {
      const seasonRanking = await this.findOrCreateSeasonRanking(athlete, matchData);
      
      const matchResult = isWinner ? 'win' : 'loss';
      const eloBefore = athlete.elo || 1500;
      const eloAfter = isWinner ? eloResult.winnerElo : eloResult.loserElo;
      const eloChange = Math.round(eloAfter - eloBefore);
      
      const glickoBefore = isWinner ? glickoResult.winner : glickoResult.loser;
      const glickoAfter = isWinner ? glickoResult.winner : glickoResult.loser;
      
      await RankingMatch.create({
        seasonRankingId: seasonRanking.id,
        athleteId: athlete.id,
        opponentId: opponent.id,
        matchResult: matchResult,
        resultType: matchData.result,
        weight: matchData.weight,
        matchDate: matchData.date,
        tournamentType: 'local',
        sourceUrl: matchData.sourceUrl,
        matchHash: `${matchHash}_${athlete.id}`,
        eloBefore: Math.round(eloBefore),
        eloAfter: Math.round(eloAfter),
        eloChange: eloChange,
        glickoRatingBefore: Number(athlete.glickoRating) || 1500,
        glickoRatingAfter: glickoAfter.newRating,
        glickoRatingChange: glickoAfter.newRating - (Number(athlete.glickoRating) || 1500),
        glickoRdBefore: Number(athlete.glickoRd) || 200,
        glickoRdAfter: glickoAfter.newRd,
        glickoRdChange: glickoAfter.newRd - (Number(athlete.glickoRd) || 200),
        glickoVolatilityBefore: Number(athlete.glickoVolatility) || 0.06,
        glickoVolatilityAfter: glickoAfter.newVolatility,
        glickoVolatilityChange: glickoAfter.newVolatility - (Number(athlete.glickoVolatility) || 0.06),
        winsBefore: athlete.wins,
        lossesBefore: athlete.losses,
        winsAfter: isWinner ? athlete.wins + 1 : athlete.wins,
        lossesAfter: isWinner ? athlete.losses : athlete.losses + 1
      });

    } catch (error) {
      console.error(`❌ Error processing ranking match for athlete ${athlete.id}:`, error);
      this.errors++;
    }
  }

  /**
   * Find or create season ranking
   */
  async findOrCreateSeasonRanking(athlete, matchData) {
    const year = matchData.date.getFullYear();
    
    let seasonRanking = await SeasonRanking.findOne({
      where: {
        athleteId: athlete.id,
        year: year,
        weightClass: matchData.weight ? `${matchData.weight} lbs` : null,
        tournamentId: this.tournamentId
      }
    });
    
    if (!seasonRanking) {
      seasonRanking = await SeasonRanking.create({
        athleteId: athlete.id,
        year: year,
        weightClass: matchData.weight ? `${matchData.weight} lbs` : null,
        team: matchData.team,
        tournamentId: this.tournamentId,
        wins: 0,
        losses: 0,
        winPercentage: 0.000,
        firstMatchDate: matchData.date,
        lastMatchDate: matchData.date,
        totalMatches: 0,
        seasonComplete: false
      });
    }
    
    return seasonRanking;
  }

  /**
   * Utility methods
   */
  parseMatchResult(text) {
    const result = text.toLowerCase();
    if (result.includes('pin') || result.includes('fall')) return 'fall';
    if (result.includes('tech') || result.includes('technical')) return 'technical-fall';
    if (result.includes('major')) return 'major-decision';
    if (result.includes('dec') || result.includes('decision')) return 'decision';
    return null;
  }

  createMatchHash(matchData) {
    const data = {
      winner: matchData.winner.toLowerCase().trim(),
      loser: matchData.loser.toLowerCase().trim(),
      weight: matchData.weight,
      date: matchData.date.toISOString().split('T')[0],
      tournament: this.tournamentId
    };
    
    return JSON.stringify(data);
  }

  async findOrCreateAthlete(name) {
    const [firstName, lastName] = this.parseWrestlerName(name);
    
    let athlete = await Athlete.findOne({
      where: {
        firstName,
        lastName
      }
    });
    
    if (!athlete) {
      athlete = await Athlete.create({
        firstName,
        lastName,
        elo: 1500,
        glickoRating: 1500,
        glickoRd: 200,
        glickoVolatility: 0.06,
        wins: 0,
        losses: 0
      });
      console.log(`✅ Created new athlete: ${firstName} ${lastName}`);
    }
    
    return athlete;
  }

  parseWrestlerName(fullName) {
    const cleaned = fullName.replace(/\([^)]*\)/g, '').trim();
    const parts = cleaned.split(' ');
    if (parts.length >= 2) {
      return [parts[0], parts.slice(1).join(' ')];
    }
    return [cleaned, ''];
  }
}

module.exports = MatchScraper;

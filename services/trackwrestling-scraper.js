const axios = require('axios');
const cheerio = require('cheerio');
const { performEloCalculation } = require('../utilities/perform-elo-calculation');
const { performGlickoCalculation } = require('../utilities/perform-glicko-calculation');
const { Athlete, Season, Match, SeasonRanking, RankingMatch } = require('../models');
const AuthFetcherHTTP = require('./auth-fetcher-http');
const MatchParser = require('./match-parser');

/**
 * TrackWrestling Automated Scraper
 * 
 * Implements the ELO ranking system flowchart:
 * 1. Navigate to TrackWrestling OPC
 * 2. Select appropriate season
 * 3. Select state association
 * 4. Process events and determine tournament type
 * 5. Scrape match data with deduplication
 * 6. Calculate ELO and Glicko ratings
 */
class TrackWrestlingScraper {
  constructor() {
    this.matchParser = new MatchParser();
    this.baseUrl = 'https://www.trackwrestling.com';
    this.opcUrl = 'https://www.trackwrestling.com/seasons/index.jsp';
    this.processedMatches = new Set(); // For deduplication
    this.sessionId = null;
    this.seasonId = null;
    this.stateId = null;
    this.targetState = null;
    this.targetSeason = null;
    this.athletesUpdated = 0;
    this.errors = 0;
    this.cookie = null;
    
    // State associations from the flowchart
    this.stateAssociations = {
      'Arizona Interscholastic Association': 7,
      'Idaho High School Activities Association': 16,
      'Nevada Interscholastic Activities Association': 34,
      'Colorado High School Activities Association': 10,
      'Utah High School Activities Association': 50
    };
  }

  /**
   * Main entry point - runs the complete scraping process
   */
  async run() {
    try {
      console.log('🚀 Starting TrackWrestling scraper...');
      
      // Step 1: Initialize authentication
      await this.initializeAuth();
      
      // Step 2: Navigate to OPC
      await this.navigateToOPC();
      
      // Step 3: Select season
      await this.selectSeason();
      
      // Step 4: Select state association
      await this.selectState();
      
      // Step 5: Process events
      await this.processEvents();
      
      console.log('✅ Scraping completed successfully');
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    }
  }

  /**
   * Initialize authentication with TrackWrestling
   */
  async initializeAuth(tournamentId = '854864132') {
    console.log('🔐 Initializing authentication...');
    const authFetcher = new AuthFetcherHTTP(tournamentId);
    const auth = await authFetcher.call();
    this.sessionId = auth.twSessionId;
    this.cookie = auth.cookie;
    console.log('✅ Authentication successful');
  }

  /**
   * Navigate to the OPC (Online Public Console)
   */
  async navigateToOPC() {
    console.log('🌐 Navigating to OPC...');
    
    // Use the session ID we already have from authentication
    const opcUrl = `${this.opcUrl}?twSessionId=${this.sessionId}`;
    
    const response = await axios.get(opcUrl, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    console.log('✅ Successfully navigated to OPC');
    console.log('OPC response status:', response.status);
  }

  /**
   * Select the appropriate season
   */
  async selectSeason() {
    console.log('📅 Selecting season...');
    
    // Use target season if specified, otherwise use current year
    const currentYear = new Date().getFullYear();
    const targetSeason = this.targetSeason || `${currentYear}-${currentYear + 1}`;
    
    // Navigate to seasons page
    const seasonsUrl = `${this.baseUrl}/seasons/index.jsp?twSessionId=${this.sessionId}`;
    let response = await axios.get(seasonsUrl, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1'
      }
    });
    let $ = cheerio.load(response.data);
    
    // Look for the desired season
    let seasonFound = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!seasonFound && attempts < maxAttempts) {
      const seasonLink = $(`a:contains("${targetSeason}")`);
      
      if (seasonLink.length > 0) {
        const seasonHref = seasonLink.first().attr('href');
        if (!seasonHref) {
          console.log(`⚠️  Season link found but no href attribute`);
          attempts++;
          continue;
        }
        const fullSeasonUrl = seasonHref.startsWith('http') ? seasonHref : `${this.baseUrl}${seasonHref}`;
        
        response = await axios.get(fullSeasonUrl, {
          headers: {
            'Cookie': this.cookie,
            'User-Agent': 'curl/8.7.1'
          }
        });
        $ = cheerio.load(response.data);
        
        // Extract season ID from URL
        const seasonIdMatch = fullSeasonUrl.match(/seasonId=(\d+)/);
        if (seasonIdMatch) {
          this.seasonId = seasonIdMatch[1];
        }
        
        seasonFound = true;
        console.log(`✅ Selected season: ${targetSeason}`);
      } else {
        // Try next page
        const nextButton = $('.icon-arrow_r, .dgNext');
        if (nextButton.length === 0) {
          throw new Error(`Season ${targetSeason} not found`);
        }
        
        const nextHref = nextButton.first().attr('href');
        if (!nextHref) {
          throw new Error(`Season ${targetSeason} not found - no next page link`);
        }
        const fullNextUrl = nextHref.startsWith('http') ? nextHref : `${this.baseUrl}${nextHref}`;
        
        response = await axios.get(fullNextUrl, {
          headers: {
            'Cookie': this.cookie,
            'User-Agent': 'curl/8.7.1'
          }
        });
        $ = cheerio.load(response.data);
        attempts++;
      }
    }
    
    if (!seasonFound) {
      throw new Error(`Season ${targetSeason} not found after ${maxAttempts} attempts`);
    }
  }

  /**
   * Select state association
   */
  async selectState() {
    console.log('🗺️  Selecting state association...');
    
    // Look for the state dropdown
    const stateSelectUrl = `${this.baseUrl}/seasons/selectState.jsp?twSessionId=${this.sessionId}&seasonId=${this.seasonId}`;
    const response = await axios.get(stateSelectUrl, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1'
      }
    });
    const $ = cheerio.load(response.data);
    
    // Find the state dropdown
    const stateSelect = $('#gbID');
    if (stateSelect.length === 0) {
      throw new Error('Could not find state selection dropdown');
    }
    
    // Use target state if specified, otherwise default to Utah
    const targetState = this.targetState || 'Utah High School Activities Association';
    const stateValue = this.stateAssociations[targetState];
    
    if (!stateValue) {
      throw new Error(`Unknown state: ${targetState}`);
    }
    
    // Submit state selection
    const stateSubmitUrl = `${this.baseUrl}/seasons/selectState.jsp`;
    const formData = new URLSearchParams({
      twSessionId: this.sessionId,
      seasonId: this.seasonId,
      gbID: stateValue
    });
    
    await axios.post(stateSubmitUrl, formData, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    this.stateId = stateValue;
    console.log(`✅ Selected state: ${targetState}`);
  }

  /**
   * Process all events for the selected state/season
   */
  async processEvents() {
    console.log('🏆 Processing events...');
    
    // Navigate to events page
    const eventsUrl = `${this.baseUrl}/events/index.jsp?twSessionId=${this.sessionId}&seasonId=${this.seasonId}&gbID=${this.stateId}`;
    const response = await axios.get(eventsUrl, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1'
      }
    });
    const $ = cheerio.load(response.data);
    
    // Find all event links
    const eventLinks = $('a[href*="events/view.jsp"]');
    console.log(`Found ${eventLinks.length} events to process`);
    
    for (let i = 0; i < eventLinks.length; i++) {
      const eventLink = $(eventLinks[i]);
      const eventHref = eventLink.attr('href');
      const fullEventUrl = eventHref.startsWith('http') ? eventHref : `${this.baseUrl}${eventHref}`;
      
      try {
        await this.processEvent(fullEventUrl);
      } catch (error) {
        console.error(`❌ Error processing event ${i + 1}:`, error.message);
        continue; // Continue with next event
      }
    }
    
    console.log('✅ Finished processing all events');
  }

  /**
   * Process a single event
   */
  async processEvent(eventUrl) {
    console.log(`🎯 Processing event: ${eventUrl}`);
    
    const response = await axios.get(eventUrl, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1'
      }
    });
    const $ = cheerio.load(response.data);
    
    // Determine if this is a tournament
    const isTournament = this.isTournament($);
    
    if (isTournament) {
      console.log('📊 Event is a tournament');
      await this.processTournament($, eventUrl);
    } else {
      console.log('🤼 Event is a dual meet');
      await this.processDualMeet($, eventUrl);
    }
  }

  /**
   * Determine if event is a tournament
   */
  isTournament($) {
    // Look for tournament indicators
    const tournamentIndicators = [
      'tournament',
      'championship',
      'invitational',
      'state',
      'regional',
      'district'
    ];
    
    const pageText = $('body').text().toLowerCase();
    return tournamentIndicators.some(indicator => pageText.includes(indicator));
  }

  /**
   * Process tournament matches
   */
  async processTournament($, eventUrl) {
    // For tournaments, we need to find all teams first
    const teamLinks = $('a[href*="teams/view.jsp"]');
    console.log(`Found ${teamLinks.length} teams in tournament`);
    
    // Process each team's matches
    for (let i = 0; i < teamLinks.length; i++) {
      const teamLink = $(teamLinks[i]);
      const teamHref = teamLink.attr('href');
      const fullTeamUrl = teamHref.startsWith('http') ? teamHref : `${this.baseUrl}${teamHref}`;
      
      try {
        await this.processTeamMatches(fullTeamUrl);
      } catch (error) {
        console.error(`❌ Error processing team ${i + 1}:`, error.message);
        continue;
      }
    }
  }

  /**
   * Process dual meet matches
   */
  async processDualMeet($, eventUrl) {
    // For dual meets, matches are directly on the event page
    await this.scrapeMatchesFromPage($, eventUrl);
  }

  /**
   * Process matches for a specific team
   */
  async processTeamMatches(teamUrl) {
    const response = await axios.get(teamUrl, {
      headers: {
        'Cookie': this.cookie,
        'User-Agent': 'curl/8.7.1'
      }
    });
    const $ = cheerio.load(response.data);
    
    await this.scrapeMatchesFromPage($, teamUrl);
  }

  /**
   * Scrape matches from a page
   */
  async scrapeMatchesFromPage($, sourceUrl) {
    const html = $.html();
    
    // Use match parser to extract matches
    const matches = this.matchParser.parseTournamentMatches(html, sourceUrl);
    
    console.log(`Found ${matches.length} matches on page`);
    
    // Process all matches
    for (const match of matches) {
      if (match.type === 'individual_match') {
        await this.processIndividualMatch(match.url);
      } else {
        await this.processMatch(match);
      }
    }
  }

  /**
   * Parse a match row from a table
   */
  parseMatchRow($row, sourceUrl) {
    const cells = $row.find('td');
    if (cells.length < 6) return null;
    
    try {
      const winner = this.extractWrestlerName($(cells[0]).text().trim());
      const loser = this.extractWrestlerName($(cells[1]).text().trim());
      const result = this.parseMatchResult($(cells[2]).text().trim());
      const weight = this.extractWeight($(cells[3]).text().trim());
      const date = this.extractDate($(cells[4]).text().trim());
      
      return {
        winner,
        loser,
        result,
        weight,
        date,
        sourceUrl,
        tournamentType: this.determineTournamentType(sourceUrl)
      };
    } catch (error) {
      console.error('Error parsing match row:', error);
      return null;
    }
  }

  /**
   * Process individual match from URL
   */
  async processIndividualMatch(matchUrl) {
    try {
      const response = await axios.get(matchUrl, {
        headers: {
          'Cookie': this.cookie,
          'User-Agent': 'curl/8.7.1'
        }
      });
      const match = await this.matchParser.parseIndividualMatch(response.data, matchUrl);
      if (match) {
        await this.processMatch(match);
      }
    } catch (error) {
      console.error(`❌ Error processing individual match ${matchUrl}:`, error.message);
      this.errors++;
    }
  }

  /**
   * Parse match data from individual match page
   */
  parseMatchPage($, matchUrl) {
    // Implementation depends on TrackWrestling's match page structure
    // This is a placeholder - you'll need to inspect the actual HTML structure
    return null;
  }

  /**
   * Process a single match (main logic)
   */
  async processMatch(matchData) {
    // Create match hash for deduplication
    const matchHash = this.createMatchHash(matchData);
    
    if (this.processedMatches.has(matchHash)) {
      console.log('⏭️  Skipping duplicate match');
      return;
    }
    
    console.log(`🏆 Processing match: ${matchData.winner} vs ${matchData.loser}`);
    
    try {
      // Find or create athletes
      const winnerAthlete = await this.findOrCreateAthlete(matchData.winner);
      const loserAthlete = await this.findOrCreateAthlete(matchData.loser);
      
      // Get current ratings
      const winnerElo = winnerAthlete.elo || 1500;
      const loserElo = loserAthlete.elo || 1500;
      
      const winnerGlicko = {
        rating: winnerAthlete.glickoRating || 1500,
        rd: winnerAthlete.glickoRd || 200,
        volatility: winnerAthlete.glickoVolatility || 0.06
      };
      
      const loserGlicko = {
        rating: loserAthlete.glickoRating || 1500,
        rd: loserAthlete.glickoRd || 200,
        volatility: loserAthlete.glickoVolatility || 0.06
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
        tournamentType: matchData.tournamentType,
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
      
      // Mark as processed
      this.processedMatches.add(matchHash);
      
      console.log(`✅ Updated ratings - Winner ELO: ${eloResult.winnerElo}, Loser ELO: ${eloResult.loserElo}`);
      
      this.athletesUpdated += 2;
      
    } catch (error) {
      console.error('❌ Error processing match:', error);
      this.errors++;
      // Don't throw - continue processing other matches
    }
  }

  /**
   * Process ranking match for an athlete
   */
  async processRankingMatch(athlete, opponent, matchData, eloResult, glickoResult, matchHash, isWinner) {
    try {
      // Get or create season ranking
      const seasonRanking = await this.findOrCreateSeasonRanking(athlete, matchData);
      
      // Determine match result and rating data
      const matchResult = isWinner ? 'win' : 'loss';
      const eloBefore = isWinner ? athlete.elo : athlete.elo;
      const eloAfter = isWinner ? eloResult.winnerElo : eloResult.loserElo;
      const eloChange = Math.round(eloAfter - eloBefore);
      
      const glickoBefore = isWinner ? glickoResult.winner : glickoResult.loser;
      const glickoAfter = isWinner ? glickoResult.winner : glickoResult.loser;
      
      // Create ranking match record
      await RankingMatch.create({
        seasonRankingId: seasonRanking.id,
        athleteId: athlete.id,
        opponentId: opponent.id,
        matchResult: matchResult,
        resultType: matchData.result,
        weight: matchData.weight,
        matchDate: matchData.date,
        tournamentType: matchData.tournamentType,
        sourceUrl: matchData.sourceUrl,
        matchHash: `${matchHash}_${athlete.id}`,
        eloBefore: Math.round(eloBefore),
        eloAfter: Math.round(eloAfter),
        eloChange: eloChange,
        glickoRatingBefore: glickoBefore.rating,
        glickoRatingAfter: glickoAfter.newRating,
        glickoRatingChange: glickoAfter.newRating - glickoBefore.rating,
        glickoRdBefore: glickoBefore.rd,
        glickoRdAfter: glickoAfter.newRd,
        glickoRdChange: glickoAfter.newRd - glickoBefore.rd,
        glickoVolatilityBefore: glickoBefore.volatility,
        glickoVolatilityAfter: glickoAfter.newVolatility,
        glickoVolatilityChange: glickoAfter.newVolatility - glickoBefore.volatility,
        winsBefore: athlete.wins,
        lossesBefore: athlete.losses,
        winsAfter: isWinner ? athlete.wins + 1 : athlete.wins,
        lossesAfter: isWinner ? athlete.losses : athlete.losses + 1
      });
      
      // Update season ranking
      await this.updateSeasonRanking(seasonRanking, matchData, isWinner, eloAfter, glickoAfter);
      
    } catch (error) {
      console.error(`❌ Error processing ranking match for athlete ${athlete.id}:`, error);
      throw error;
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
        team: null, // You might want to extract team from matchData
        tournamentId: null // You might want to extract tournament from matchData
      }
    });
    
    if (!seasonRanking) {
      seasonRanking = await SeasonRanking.create({
        athleteId: athlete.id,
        year: year,
        weightClass: matchData.weight ? `${matchData.weight} lbs` : null,
        team: null,
        division: null,
        grade: null,
        wins: 0,
        losses: 0,
        winPercentage: 0.000,
        firstMatchDate: matchData.date,
        lastMatchDate: matchData.date,
        totalMatches: 0,
        seasonComplete: false
      });
      
      console.log(`✅ Created new season ranking for athlete ${athlete.id} (${year})`);
    }
    
    return seasonRanking;
  }

  /**
   * Update season ranking with new match data
   */
  async updateSeasonRanking(seasonRanking, matchData, isWinner, newElo, newGlicko) {
    const updates = {
      lastMatchDate: matchData.date,
      totalMatches: seasonRanking.totalMatches + 1,
      finalElo: Math.round(newElo),
      finalGlickoRating: newGlicko.newRating,
      finalGlickoRd: newGlicko.newRd,
      finalGlickoVolatility: newGlicko.newVolatility
    };
    
    if (isWinner) {
      updates.wins = seasonRanking.wins + 1;
    } else {
      updates.losses = seasonRanking.losses + 1;
    }
    
    // Calculate win percentage
    const totalMatches = updates.wins + updates.losses;
    updates.winPercentage = totalMatches > 0 ? (updates.wins / totalMatches) : 0;
    
    // Track peak ratings
    if (!seasonRanking.peakElo || newElo > seasonRanking.peakElo) {
      updates.peakElo = Math.round(newElo);
      updates.peakEloDate = matchData.date;
    }
    
    if (!seasonRanking.lowestElo || newElo < seasonRanking.lowestElo) {
      updates.lowestElo = Math.round(newElo);
      updates.lowestEloDate = matchData.date;
    }
    
    if (!seasonRanking.peakGlickoRating || newGlicko.newRating > seasonRanking.peakGlickoRating) {
      updates.peakGlickoRating = newGlicko.newRating;
      updates.peakGlickoDate = matchData.date;
    }
    
    await seasonRanking.update(updates);
  }

  /**
   * Create hash for match deduplication
   */
  createMatchHash(matchData) {
    const data = {
      winner: matchData.winner.toLowerCase().trim(),
      loser: matchData.loser.toLowerCase().trim(),
      weight: matchData.weight,
      date: matchData.date
    };
    
    return JSON.stringify(data);
  }

  /**
   * Find or create athlete
   */
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
        glickoVolatility: 0.06
      });
      console.log(`✅ Created new athlete: ${firstName} ${lastName}`);
    }
    
    return athlete;
  }

  /**
   * Utility methods for parsing match data
   */
  extractWrestlerName(text) {
    // Remove school names, weights, etc.
    return text.replace(/\([^)]*\)/g, '').trim();
  }

  parseWrestlerName(fullName) {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return [parts[0], parts.slice(1).join(' ')];
    }
    return [fullName, ''];
  }

  parseMatchResult(text) {
    const result = text.toLowerCase();
    if (result.includes('pin') || result.includes('fall')) return 'fall';
    if (result.includes('tech') || result.includes('technical')) return 'technical-fall';
    if (result.includes('major')) return 'major-decision';
    return 'decision';
  }

  extractWeight(text) {
    const weightMatch = text.match(/(\d+)\s*lbs?/i);
    return weightMatch ? parseInt(weightMatch[1]) : null;
  }

  extractDate(text) {
    // Parse various date formats
    return new Date(text);
  }

  determineTournamentType(url) {
    if (url.includes('state')) return 'state';
    if (url.includes('regional')) return 'regional';
    if (url.includes('district')) return 'district';
    return 'local';
  }
}

module.exports = TrackWrestlingScraper;

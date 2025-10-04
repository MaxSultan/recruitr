const trackwrestlingBrowserService = require('../browser/trackwrestlingBrowserService');
const trackwrestlingMatchParser = require('../parsers/trackwrestlingMatchParser');
const { Athlete, SeasonRanking, RankingMatch } = require('../../models');
const { performEloCalculation } = require('../../utilities/perform-elo-calculation');
const { performGlickoCalculation } = require('../../utilities/perform-glicko-calculation');
const crypto = require('crypto');

/**
 * Main scraper service for TrackWrestling
 * Single Responsibility: Orchestrate browser automation and data processing
 */
class TrackWrestlingScraperService {
  
  constructor(options = {}) {
    this.browserService = trackwrestlingBrowserService;
    this.parser = trackwrestlingMatchParser;
    this.processedMatches = new Set();
    
    // Set scraping parameters
    this.season = options.season || '2024-25';
    this.state = options.state || 'Utah';
    this.level = options.level || 'High School';
    this.sex = options.sex || 'Boys';
    this.maxEvents = options.maxEvents || null;
    this.maxTeams = options.maxTeams || null;
    this.trackProgress = options.trackProgress || false;
    
    // Create state key for progress tracking
    this.stateKey = `${this.season} ${this.level} ${this.sex}`;
    
    console.log('🏗️  Initialized TrackWrestlingScraperService with:');
    console.log(`   📅 Season: ${this.season}`);
    console.log(`   🗺️  State: ${this.state}`);
    console.log(`   🎓 Level: ${this.level}`);
    console.log(`   ⚧ Sex: ${this.sex}`);
  }

  /**
   * Get state ID for TrackWrestling
   * @param {string} stateName - Name of the state
   * @returns {string} State ID
   */
  getStateId(stateName) {
    const stateMap = {
      'Utah': '50',
      'Colorado': '6',
      'Arizona': '3',
      'Nevada': '28',
      'Idaho': '12'
    };
    
    return stateMap[stateName] || '50'; // Default to Utah if not found
  }

  /**
   * Get events in chronological order
   * @param {Object} options - Scraping options
   * @returns {Array} Array of events sorted chronologically
   */
  async getEventsChronologically(options = {}) {
    const {
      headless = true
    } = options;

    try {
      console.log('📅 Getting events in chronological order...');
      
      // Build target season string from parameters
      const targetSeason = `${this.season} ${this.level} ${this.sex}`;
      const stateId = this.getStateId(this.state);
      
      console.log(`🎯 Target season: ${targetSeason}`);
      console.log(`🗺️  State ID: ${stateId}`);
      
      await this.browserService.initialize({ headless });
      await this.browserService.navigateToSeasons();
      await this.browserService.selectSeason(targetSeason);
      await this.browserService.selectState(stateId);
      
      // Get all events with dates
      const events = await this.browserService.getEventLinks();
      
      await this.browserService.close();
      
      console.log(`✅ Retrieved ${events.length} events in chronological order`);
      return events;
      
    } catch (error) {
      console.error('❌ Failed to get chronological events:', error);
      await this.browserService.close();
      throw error;
    }
  }

  /**
   * Scrape a single event chronologically
   * @param {Object} options - Scraping options
   * @returns {Object} Processing results
   */
  async scrapeEventChronologically(options = {}) {
    const {
      event,
      maxTeams = 10,
      headless = true
    } = options;

    const results = {
      eventName: event.text,
      eventDate: event.dateText,
      totalTeams: 0,
      totalMatches: 0,
      processedMatches: 0,
      errors: []
    };

    try {
      console.log(`🏆 Processing event: ${event.text}`);
      console.log(`📆 Event date: ${event.dateText}`);
      
      await this.browserService.initialize({ headless });
      await this.browserService.navigateToSeasons();
      await this.browserService.selectSeason('2024-25 High School Boys');
      await this.browserService.selectState('50');
      
      // Navigate to specific event
      const teamLinks = await this.browserService.getTeamLinks(event.onclick || event.href);
      results.totalTeams = teamLinks.length;
      
      console.log(`🏫 Found ${teamLinks.length} teams in event`);
      
      // Process teams (limited by maxTeams) OR handle single match events
      const teamsToProcess = teamLinks.slice(0, maxTeams);
      let allMatches = [];
      
      if (teamsToProcess.length > 0) {
        // Case 1: Tournament event with multiple teams
        console.log(`🏆 Tournament event: Processing ${teamsToProcess.length} teams`);
        
        for (let i = 0; i < teamsToProcess.length; i++) {
          const team = teamsToProcess[i];
          console.log(`🏫 Processing team ${i + 1}/${teamsToProcess.length}: ${team.text}`);
          
          try {
            const teamMatches = await this.browserService.getTeamMatches(team.href);
            
            // Add event date to each match
            const matchesWithEventDate = teamMatches.map(match => ({
              ...match,
              eventDate: event.date
            }));
            
            allMatches = allMatches.concat(matchesWithEventDate);
            results.totalMatches += matchesWithEventDate.length;
            
          } catch (teamError) {
            console.error(`❌ Failed to process team ${team.text}:`, teamError.message);
            results.errors.push({
              type: 'team_processing',
              team: team.text,
              error: teamError.message
            });
          }
        }
      } else {
        // Case 2: Single match event (dual meet) - no teams to click
        console.log(`🥊 Single match event: No teams found, trying to get match data directly`);
        
        try {
          // Try to get match data from current view (should be a new tab with match data)
          const directMatches = await this.browserService.getMatchDataFromCurrentView();
          
          if (directMatches && directMatches.length > 0) {
            console.log(`✅ Found ${directMatches.length} matches in single match event`);
            
            // Add event date to each match
            const matchesWithEventDate = directMatches.map(match => ({
              ...match,
              eventDate: event.date
            }));
            
            allMatches = allMatches.concat(matchesWithEventDate);
            results.totalMatches += matchesWithEventDate.length;
          } else {
            console.log(`⚠️  No matches found in single match event - may not have results yet`);
          }
          
        } catch (directError) {
          console.error(`❌ Failed to get match data from single match event:`, directError.message);
          results.errors.push({
            type: 'single_match_processing',
            error: directError.message
          });
        }
      }
      
      // Sort matches chronologically within the event
      allMatches.sort((a, b) => {
        // First sort by weight class
        const weightA = parseInt(a.weightClass) || 999;
        const weightB = parseInt(b.weightClass) || 999;
        if (weightA !== weightB) return weightA - weightB;
        
        // Then by match order (assuming they're already in chronological order from the page)
        return a.matchIndex - b.matchIndex;
      });
      
      console.log(`🥊 Found ${allMatches.length} total matches in event`);
      
      // Process matches in chronological order
      for (const match of allMatches) {
        try {
          const processed = await this.processMatch(match, event.date);
          if (processed) {
            results.processedMatches++;
          }
        } catch (matchError) {
          console.error(`❌ Failed to process match:`, matchError.message);
          results.errors.push({
            type: 'match_processing',
            match: match.rawText,
            error: matchError.message
          });
        }
      }
      
      await this.browserService.close();
      
      console.log(`✅ Event completed: ${results.processedMatches}/${results.totalMatches} matches processed`);
      return results;
      
    } catch (error) {
      console.error('❌ Failed to scrape event chronologically:', error);
      await this.browserService.close();
      throw error;
    }
  }

  /**
   * Process a single match with event date
   * @param {Object} match - Match data
   * @param {Date} eventDate - Event date
   * @returns {boolean} True if processed successfully
   */
  async processMatch(match, eventDate) {
    try {
      // Parse the match with event date
      const parsedMatch = this.parser.parseMatch(match.rawText, match.weightClass, eventDate);
      
      if (!parsedMatch) {
        console.warn('⚠️  Could not parse match:', match.rawText);
        return false;
      }
      
      // Generate hash for deduplication
      const matchHash = this.generateMatchHash(parsedMatch);
      
      // Check if match already exists
      const existingMatch = await RankingMatch.findOne({ where: { matchHash } });
      if (existingMatch) {
        console.log(`⚠️  Database duplicate match skipped: ${parsedMatch.winner.fullName} vs ${parsedMatch.loser.fullName}`);
        return false;
      }
      
      // Process the match (create athletes, calculate ratings, etc.)
      const winner = await this.findOrCreateAthlete(parsedMatch.winner);
      const loser = await this.findOrCreateAthlete(parsedMatch.loser);
      
      // Create or get season ranking for winner
      const winnerSeasonRanking = await this.findOrCreateSeasonRankingSimple(winner.id, parsedMatch.weightClass);
      
      // Create or get season ranking for loser  
      const loserSeasonRanking = await this.findOrCreateSeasonRankingSimple(loser.id, parsedMatch.weightClass);
      
      // Calculate ELO and Glicko ratings for the match
      const eloResult = performEloCalculation({
        winnerElo: winnerSeasonRanking.finalElo || 1500,
        loserElo: loserSeasonRanking.finalElo || 1500,
        result: parsedMatch.result.type // Use actual match result type (fall, decision, etc.)
      });
      
      const glickoResult = performGlickoCalculation(
        {
          rating: winnerSeasonRanking.finalGlickoRating || 1500,
          rd: winnerSeasonRanking.finalGlickoRd || 200,
          volatility: winnerSeasonRanking.finalGlickoVolatility || 0.06,
          id: winner.id,
          name: winner.fullName
        },
        {
          rating: loserSeasonRanking.finalGlickoRating || 1500,
          rd: loserSeasonRanking.finalGlickoRd || 200,
          volatility: loserSeasonRanking.finalGlickoVolatility || 0.06,
          id: loser.id,
          name: loser.fullName
        },
        parsedMatch.result.type // Use actual match result type (fall, decision, etc.)
      );
      
      // Create ranking match for winner
      await this.createRankingMatch(
        winnerSeasonRanking.id,
        winner.id,
        loser.id,
        'win',
        parsedMatch,
        eloResult,
        glickoResult,
        matchHash,
        eventDate
      );
      
      // Create ranking match for loser
      await this.createRankingMatch(
        loserSeasonRanking.id,
        loser.id,
        winner.id,
        'loss',
        parsedMatch,
        eloResult,
        glickoResult,
        matchHash,
        eventDate
      );
      
      // Update season rankings with new ELO/Glicko values
      await this.updateSeasonRanking(winnerSeasonRanking.id, eloResult.winnerElo, glickoResult.winner);
      await this.updateSeasonRanking(loserSeasonRanking.id, eloResult.loserElo, glickoResult.loser);
      
      console.log(`✅ Processed match: ${parsedMatch.winner.fullName} vs ${parsedMatch.loser.fullName} on ${eventDate}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error processing match:', error);
      return false;
    }
  }

  /**
   * Main scraping method
   */
  async scrapeMatches(options = {}) {
    const {
      targetSeason = '2024-25 High School Boys',
      stateId = '50',
      headless = true,
      maxEvents = null, // Process all events
      maxTeams = null,  // Process all teams
      specificEventIndex = null, // Process specific event by index
      eventDate = null  // Event date for matches
    } = options;

    const results = {
      totalEvents: 0,
      totalTeams: 0,
      totalMatches: 0,
      processedMatches: 0,
      errors: [],
      matches: []
    };

    try {
      console.log('🚀 Starting TrackWrestling scraping...');
      console.log(`📅 Target Season: ${targetSeason}`);
      console.log(`🏛️  State ID: ${stateId}`);
      
      await this.browserService.initialize({ headless });
      await this.browserService.navigateToSeasons();
      await this.browserService.selectSeason(targetSeason);
      await this.browserService.selectState(stateId);
      await this.browserService.increasePagination(10000);
      
      const events = await this.browserService.getEventLinks();
      results.totalEvents = events.length;
      
      console.log(`📅 Found ${events.length} events`);
      
      // Handle specific event index for chronological processing
      let eventsToProcess;
      if (specificEventIndex !== null && specificEventIndex >= 0 && specificEventIndex < events.length) {
        eventsToProcess = [events[specificEventIndex]];
        console.log(`🎯 Processing specific event at index ${specificEventIndex}: ${eventsToProcess[0].text}`);
      } else {
        eventsToProcess = maxEvents ? events.slice(0, maxEvents) : events;
      }
      
      for (let i = 0; i < eventsToProcess.length; i++) {
        const event = eventsToProcess[i];
        console.log(`\n📅 Processing event ${i + 1}/${eventsToProcess.length}: ${event.text}`);
        
        // Clear in-memory duplicate tracking for each new event
        this.processedMatches.clear();
        console.log(`🔄 Cleared in-memory duplicate tracking for event: ${event.text}`);
        
        try {
          const teams = await this.browserService.getTeamLinks(event.href);
          results.totalTeams += teams.length;
          
          console.log(`🏫 Found ${teams.length} teams in event`);
          
          if (teams.length > 0) {
            // Case 1: Tournament event with multiple teams
            console.log(`🏆 Tournament event: Processing ${teams.length} teams`);
            
            // For dual meets, only process matches once (from first team)
            // For tournaments, we might need to process multiple teams
            const teamsToProcess = teams.length <= 2 ? teams.slice(0, 1) : (maxTeams ? teams.slice(0, maxTeams) : teams);
            
            for (let j = 0; j < teamsToProcess.length; j++) {
              const team = teamsToProcess[j];
              console.log(`  🏫 Processing team ${j + 1}/${teamsToProcess.length}: ${team.text}`);
              
              try {
                // Use the new method to get match data from current view or click team
                const matchData = await this.browserService.getMatchDataFromCurrentView(team.index);
                // Convert matchData to the format expected by the parser
                const formattedMatchData = matchData.map(match => ({
                  matchText: match.matchText,
                  weightClass: match.weightClass
                }));
                const parsedMatches = this.parser.parseMatches(formattedMatchData);
                results.totalMatches += parsedMatches.length;
                
                for (const match of parsedMatches) {
                  try {
                    const savedMatch = await this.processAndSaveMatch(match, event, team, eventDate);
                    if (savedMatch) {
                      results.processedMatches++;
                      results.matches.push(savedMatch);
                    }
                  } catch (matchError) {
                    console.error(`    ❌ Error processing match:`, matchError.message);
                    results.errors.push({
                      type: 'match_processing',
                      error: matchError.message,
                      match: match
                    });
                  }
                }
                
              } catch (teamError) {
                console.error(`  ❌ Error processing team ${team.text}:`, teamError.message);
                results.errors.push({
                  type: 'team_processing',
                  error: teamError.message,
                  team: team
                });
              }
            }
          } else {
            // Case 2: Single match event (dual meet) - no teams to click
            console.log(`🥊 Single match event: No teams found, trying to get match data directly`);
            
            try {
              // Try to get match data from current view (should be a new tab with match data)
              const matchData = await this.browserService.getMatchDataFromCurrentView();
              // Convert matchData to the format expected by the parser
              const formattedMatchData = matchData.map(match => ({
                matchText: match.matchText,
                weightClass: match.weightClass
              }));
              const parsedMatches = this.parser.parseMatches(formattedMatchData);
              
              if (parsedMatches && parsedMatches.length > 0) {
                console.log(`✅ Found ${parsedMatches.length} matches in single match event`);
                results.totalMatches += parsedMatches.length;
                
                for (const match of parsedMatches) {
                  try {
                    const savedMatch = await this.processAndSaveMatch(match, event, null, eventDate);
                    if (savedMatch) {
                      results.processedMatches++;
                      results.matches.push(savedMatch);
                    }
                  } catch (matchError) {
                    console.error(`    ❌ Error processing match:`, matchError.message);
                    results.errors.push({
                      type: 'match_processing',
                      error: matchError.message,
                      match: match
                    });
                  }
                }
              } else {
                console.log(`⚠️  No matches found in single match event - may not have results yet`);
              }
              
            } catch (directError) {
              console.error(`❌ Failed to get match data from single match event:`, directError.message);
              results.errors.push({
                type: 'single_match_processing',
                error: directError.message
              });
            }
          }
          
        } catch (eventError) {
          console.error(`❌ Error processing event ${event.text}:`, eventError.message);
          results.errors.push({
            type: 'event_processing',
            error: eventError.message,
            event: event
          });
        }
      }
      
      console.log('\n✅ Scraping completed successfully!');
      console.log(`📊 Results: ${results.processedMatches} matches processed from ${results.totalEvents} events and ${results.totalTeams} teams`);
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      results.errors.push({
        type: 'general',
        error: error.message
      });
    } finally {
      await this.browserService.close();
    }

    return results;
  }

  async processAndSaveMatch(match, event, team, eventDate = null) {
    try {
      const matchHash = this.createMatchHash(match);
      
      if (this.processedMatches.has(matchHash)) {
        console.log(`    ⚠️  Duplicate match skipped: ${match.winner.fullName} vs ${match.loser.fullName}`);
        return null;
      }
      
      // Check database for existing match with same hash
      const existingMatch = await RankingMatch.findOne({
        where: { matchHash: matchHash }
      });
      
      if (existingMatch) {
        console.log(`    ⚠️  Database duplicate match skipped: ${match.winner.fullName} vs ${match.loser.fullName}`);
        this.processedMatches.add(matchHash);
        return null;
      }
      
      this.processedMatches.add(matchHash);
      
      const winner = await this.findOrCreateAthlete(match.winner);
      const loser = await this.findOrCreateAthlete(match.loser);
      
      const winnerSeason = await this.findOrCreateSeasonRanking(winner.id, match, event, team);
      const loserSeason = await this.findOrCreateSeasonRanking(loser.id, match, event, team);
      
      const eloResult = performEloCalculation({
        winnerElo: winnerSeason.finalElo || 1500,
        loserElo: loserSeason.finalElo || 1500,
        result: match.result.type
      });
      
      const glickoResult = performGlickoCalculation(
        {
          rating: winnerSeason.finalGlickoRating || 1500,
          rd: winnerSeason.finalGlickoRd || 200,
          volatility: winnerSeason.finalGlickoVolatility || 0.06,
          id: winner.id,
          name: winner.fullName
        },
        {
          rating: loserSeason.finalGlickoRating || 1500,
          rd: loserSeason.finalGlickoRd || 200,
          volatility: loserSeason.finalGlickoVolatility || 0.06,
          id: loser.id,
          name: loser.fullName
        },
        match.result.type
      );
      
      const winnerRankingMatch = await this.createRankingMatch(
        winnerSeason.id, winner.id, loser.id, 'win', match, eloResult, glickoResult, matchHash, eventDate
      );
      
      const loserRankingMatch = await this.createRankingMatch(
        loserSeason.id, loser.id, winner.id, 'loss', match, eloResult, glickoResult, matchHash, eventDate
      );
      
      await this.updateSeasonRanking(winnerSeason.id, eloResult.winnerElo, glickoResult.winner);
      await this.updateSeasonRanking(loserSeason.id, eloResult.loserElo, glickoResult.loser);
      
      console.log(`    ✅ Processed: ${match.winner.fullName} over ${match.loser.fullName} (${match.result.type})`);
      
      return {
        match: match,
        winner: winner,
        loser: loser,
        winnerRankingMatch: winnerRankingMatch,
        loserRankingMatch: loserRankingMatch
      };
      
    } catch (error) {
      console.error('Error processing match:', error);
      throw error;
    }
  }

  createMatchHash(match) {
    const hashString = `${match.winner.fullName}-${match.loser.fullName}-${match.result.raw}-${match.weightClass}`;
    return crypto.createHash('md5').update(hashString).digest('hex');
  }

  async findOrCreateAthlete(wrestlerData) {
    // Ensure lastName is never empty - handle all edge cases
    let firstName = wrestlerData.firstName;
    let lastName = wrestlerData.lastName;
    
    // Additional safety checks for edge cases
    if (!firstName || firstName.trim() === '') {
      firstName = 'Unknown';
    }
    if (!lastName || lastName.trim() === '') {
      lastName = 'Unknown';
    }
    
    // Clean up the names
    firstName = firstName.trim();
    lastName = lastName.trim();
    
    let athlete = await Athlete.findOne({
      where: {
        firstName: firstName,
        lastName: lastName
      }
    });
    
    if (!athlete) {
      athlete = await Athlete.create({
        firstName: firstName,
        lastName: lastName,
        state: 'UT'
      });
    }
    
    return athlete;
  }

  async findOrCreateSeasonRanking(athleteId, match, event, team) {
    let seasonRanking = await SeasonRanking.findOne({
      where: {
        athleteId: athleteId,
        year: 2025,
        weightClass: match.weightClass
      }
    });
    
    if (!seasonRanking) {
      seasonRanking = await SeasonRanking.create({
        athleteId: athleteId,
        year: 2025,
        weightClass: match.weightClass,
        team: team ? team.text : 'Unknown',
        firstMatchDate: new Date(),
        seasonComplete: false,
        finalElo: 1500,
        finalGlickoRating: 1500,
        finalGlickoRd: 200,
        finalGlickoVolatility: 0.06
      });
    }
    
    return seasonRanking;
  }

  async findOrCreateSeasonRankingSimple(athleteId, weightClass) {
    let seasonRanking = await SeasonRanking.findOne({
      where: {
        athleteId: athleteId,
        year: 2025,
        weightClass: weightClass
      }
    });
    
    if (!seasonRanking) {
      seasonRanking = await SeasonRanking.create({
        athleteId: athleteId,
        year: 2025,
        weightClass: weightClass,
        team: 'Unknown',
        firstMatchDate: new Date(),
        seasonComplete: false,
        finalElo: 1500,
        finalGlickoRating: 1500,
        finalGlickoRd: 200,
        finalGlickoVolatility: 0.06
      });
    }
    
    return seasonRanking;
  }

  async createRankingMatch(seasonRankingId, athleteId, opponentId, matchResult, match, eloResult, glickoResult, matchHash, eventDate = null) {
    const athleteData = matchResult === 'win' ? glickoResult.winner : glickoResult.loser;
    const opponentData = matchResult === 'win' ? glickoResult.loser : glickoResult.winner;
    
    // Get the BEFORE ratings from season ranking
    const seasonRanking = await SeasonRanking.findByPk(seasonRankingId);
    const eloBefore = seasonRanking ? (seasonRanking.finalElo || 1500) : 1500;
    const eloAfter = matchResult === 'win' ? eloResult.winnerElo : eloResult.loserElo;
    
    return await RankingMatch.create({
      seasonRankingId: seasonRankingId,
      athleteId: athleteId,
      opponentId: opponentId,
      matchResult: matchResult,
      resultType: match.result.type,
      weight: parseInt(match.weightClass) || null,
      matchDate: eventDate || new Date(),
      tournamentType: 'local',
      matchHash: matchHash,
      
      eloBefore: Math.round(eloBefore),
      eloAfter: Math.round(eloAfter),
      eloChange: Math.round(eloAfter - eloBefore),
      
      glickoRatingBefore: athleteData.oldRating,
      glickoRatingAfter: athleteData.newRating,
      glickoRatingChange: athleteData.ratingChange,
      glickoRdBefore: athleteData.oldRd,
      glickoRdAfter: athleteData.newRd,
      glickoRdChange: athleteData.rdChange,
      glickoVolatilityBefore: athleteData.oldVolatility,
      glickoVolatilityAfter: athleteData.newVolatility,
      glickoVolatilityChange: athleteData.newVolatility - athleteData.oldVolatility,
      
      winsBefore: 0,
      lossesBefore: 0,
      winsAfter: matchResult === 'win' ? 1 : 0,
      lossesAfter: matchResult === 'loss' ? 1 : 0,
      
      opponentEloAtTime: Math.round(matchResult === 'win' ? eloResult.loserElo : eloResult.winnerElo),
      opponentGlickoAtTime: opponentData.oldRating,
      opponentGlickoRdAtTime: opponentData.oldRd,
      
      athleteEloAtTime: Math.round(eloBefore),
      athleteGlickoAtTime: athleteData.oldRating,
      athleteGlickoRdAtTime: athleteData.oldRd
    });
  }

  async updateSeasonRanking(seasonRankingId, newElo, glickoData) {
    // Update the SeasonRanking record
    const seasonRanking = await SeasonRanking.findByPk(seasonRankingId);
    if (!seasonRanking) {
      throw new Error(`SeasonRanking with id ${seasonRankingId} not found`);
    }

    await SeasonRanking.update({
      finalElo: Math.round(newElo),
      finalGlickoRating: glickoData.newRating,
      finalGlickoRd: glickoData.newRd,
      finalGlickoVolatility: glickoData.newVolatility,
      lastMatchDate: new Date()
    }, {
      where: { id: seasonRankingId }
    });

    // Also update the main Athlete record with current ratings
    await Athlete.update({
      elo: Math.round(newElo),
      glickoRating: glickoData.newRating,
      glickoRd: glickoData.newRd,
      glickoVolatility: glickoData.newVolatility,
      lastMatchDate: new Date()
    }, {
      where: { id: seasonRanking.athleteId }
    });
  }

  /**
   * Generate a unique hash for a match to prevent duplicates
   * @param {Object} parsedMatch - Parsed match data
   * @returns {string} Unique hash for the match
   */
  generateMatchHash(parsedMatch) {
    const crypto = require('crypto');
    
    // Create a consistent string representation of the match
    const matchString = [
      parsedMatch.winner.firstName,
      parsedMatch.winner.lastName,
      parsedMatch.loser.firstName,
      parsedMatch.loser.lastName,
      parsedMatch.weightClass,
      parsedMatch.result.type,
      parsedMatch.matchDate ? parsedMatch.matchDate.toISOString().split('T')[0] : 'unknown'
    ].join('|');
    
    // Generate MD5 hash
    return crypto.createHash('md5').update(matchString).digest('hex');
  }
}

module.exports = new TrackWrestlingScraperService();
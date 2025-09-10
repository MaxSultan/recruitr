const AuthFetcherHTTP = require('../services/auth-fetcher-http');
const TournamentParticipantsScraper = require('../services/tournament-scraper');
const athleteService = require('../services/athleteService');

class TournamentController {
  /**
   * Scrape tournament participants data (without saving to database)
   */
  async getParticipants(req, res) {
    try {
      const { tournamentId } = req.params;
      
      if (!tournamentId) {
        return res.status(400).json({
          error: 'Tournament ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`🏆 Scraping participants for tournament ${tournamentId}...`);
      
      const scraper = new TournamentParticipantsScraper(tournamentId, new Date().getFullYear().toString());
      const participants = await scraper.call();
      
      console.log(`✅ Scraped ${participants.length} participants from tournament ${tournamentId}`);
      
      res.json({
        success: true,
        data: participants,
        count: participants.length,
        tournamentId: tournamentId,
        year: new Date().getFullYear().toString(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error scraping tournament participants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scrape tournament participants',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Scrape tournament participants and save to database
   */
  async scrapeTournament(req, res) {
    try {
      const { tournamentId, year, state } = req.body;
      
      if (!tournamentId) {
        return res.status(400).json({
          error: 'Tournament ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`🏆 Scraping and saving tournament ${tournamentId} for year ${year || new Date().getFullYear()}...`);
      
      const scraper = new TournamentParticipantsScraper(tournamentId, year || new Date().getFullYear().toString());
      const participants = await scraper.call();
      
      console.log(`📊 Processing ${participants.length} participants...`);
      
      let savedCount = 0;
      let skippedCount = 0;
      
      for (const participant of participants) {
        try {
          const athlete = await athleteService.findOrCreateAthlete(
            participant.firstName,
            participant.lastName,
            state || participant.state
          );
          
          const seasonData = {
            year: participant.year,
            weightClass: participant.weightClass,
            division: participant.division,
            team: participant.team,
            wins: participant.wins,
            losses: participant.losses,
            place: participant.place,
            pointsScored: participant.pointsScored,
            statePlacement: participant.statePlacement,
            grade: participant.grade,
            tournamentId: tournamentId
          };
          
          // Create or update season (createSeason handles duplicate checking internally)
          const result = await athleteService.createSeason(athlete.id, seasonData);
          
          if (result.wasCreated) {
            savedCount++;
          } else {
            skippedCount++;
          }
        } catch (participantError) {
          console.error(`❌ Error processing participant ${participant.firstName} ${participant.lastName}:`, participantError);
          skippedCount++;
        }
      }
      
      console.log(`✅ Tournament scraping completed. Saved: ${savedCount}, Skipped: ${skippedCount}`);
      
      res.json({
        success: true,
        data: {
          totalParticipants: participants.length,
          savedCount,
          skippedCount,
          tournamentId,
          year: year || new Date().getFullYear().toString(),
          state: state || 'Unknown'
        },
        message: `Tournament data processed successfully. ${savedCount} new seasons created, ${skippedCount} existing seasons updated.`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error scraping tournament:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scrape tournament',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get teams for a tournament
   */
  async getTeams(req, res) {
    try {
      const { tournamentId } = req.params;
      
      if (!tournamentId) {
        return res.status(400).json({
          error: 'Tournament ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`🏫 Getting teams for tournament ${tournamentId}...`);
      
      const scraper = new TournamentParticipantsScraper(tournamentId, new Date().getFullYear().toString());
      await scraper.initialize();
      const teams = await scraper.getTeams();
      
      console.log(`✅ Found ${teams.length} teams for tournament ${tournamentId}`);
      
      res.json({
        success: true,
        data: teams,
        count: teams.length,
        tournamentId: tournamentId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting tournament teams:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tournament teams',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new TournamentController();

const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

/**
 * Controller for TrackWrestling scraping endpoints
 * Single Responsibility: Handle TrackWrestling scraping requests
 */
class TrackWrestlingController {
  
  /**
   * Scrape matches from TrackWrestling
   * POST /api/trackwrestling/scrape
   */
  async scrapeMatches(req, res) {
    try {
      const {
        targetSeason = '2025-26 High School Boys',
        stateId = '50', // Utah
        headless = true,
        maxEvents = 5,
        maxTeams = 3
      } = req.body;

      console.log('🚀 Starting TrackWrestling scraping request...');
      console.log(`📅 Target Season: ${targetSeason}`);
      console.log(`🏛️  State ID: ${stateId}`);
      console.log(`👁️  Headless: ${headless}`);
      console.log(`📊 Max Events: ${maxEvents}, Max Teams: ${maxTeams}`);

      // Start scraping
      const results = await trackwrestlingScraperService.scrapeMatches({
        targetSeason,
        stateId,
        headless,
        maxEvents,
        maxTeams
      });

      console.log('✅ Scraping completed successfully');

      res.json({
        success: true,
        message: 'TrackWrestling scraping completed successfully',
        data: {
          summary: {
            totalEvents: results.totalEvents,
            totalTeams: results.totalTeams,
            totalMatches: results.totalMatches,
            processedMatches: results.processedMatches,
            errorCount: results.errors.length
          },
          errors: results.errors,
          matches: results.matches.map(match => ({
            winner: match.winner.fullName,
            loser: match.loser.fullName,
            result: match.match.result.type,
            weightClass: match.match.weightClass,
            tournamentRound: match.match.tournamentRound
          }))
        }
      });

    } catch (error) {
      console.error('❌ TrackWrestling scraping failed:', error);
      res.status(500).json({
        success: false,
        error: 'TrackWrestling scraping failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get scraping status (for long-running operations)
   * GET /api/trackwrestling/status
   */
  async getScrapingStatus(req, res) {
    try {
      // This could be enhanced to track scraping progress
      res.json({
        success: true,
        data: {
          status: 'idle',
          message: 'No active scraping operations'
        }
      });
    } catch (error) {
      console.error('❌ Error getting scraping status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get scraping status',
        message: error.message
      });
    }
  }

  /**
   * Test browser connection
   * GET /api/trackwrestling/test-browser
   */
  async testBrowser(req, res) {
    try {
      const { headless = true } = req.query;
      
      console.log('🧪 Testing browser connection...');
      
      const trackwrestlingBrowserService = require('../services/browser/trackwrestlingBrowserService');
      
      // Initialize browser
      await trackwrestlingBrowserService.initialize({ headless: headless === 'true' });
      
      // Navigate to TrackWrestling
      await trackwrestlingBrowserService.navigateToSeasons();
      
      // Take a screenshot
      await trackwrestlingBrowserService.screenshot('test-browser.png');
      
      // Close browser
      await trackwrestlingBrowserService.close();
      
      res.json({
        success: true,
        message: 'Browser test completed successfully',
        data: {
          screenshot: 'test-browser.png'
        }
      });
      
    } catch (error) {
      console.error('❌ Browser test failed:', error);
      res.status(500).json({
        success: false,
        error: 'Browser test failed',
        message: error.message
      });
    }
  }

  /**
   * Parse match text (for testing parser)
   * POST /api/trackwrestling/parse-match
   */
  async parseMatch(req, res) {
    try {
      const { matchText, weightClass } = req.body;
      
      if (!matchText) {
        return res.status(400).json({
          success: false,
          error: 'matchText is required'
        });
      }

      const trackwrestlingMatchParser = require('../services/parsers/trackwrestlingMatchParser');
      
      const parsedMatch = trackwrestlingMatchParser.parseMatch(matchText, weightClass || '145 lbs');
      
      if (!parsedMatch) {
        return res.status(400).json({
          success: false,
          error: 'Failed to parse match text'
        });
      }

      res.json({
        success: true,
        data: {
          original: matchText,
          parsed: parsedMatch,
          valid: trackwrestlingMatchParser.validateMatch(parsedMatch)
        }
      });
      
    } catch (error) {
      console.error('❌ Match parsing failed:', error);
      res.status(500).json({
        success: false,
        error: 'Match parsing failed',
        message: error.message
      });
    }
  }
}

module.exports = new TrackWrestlingController();

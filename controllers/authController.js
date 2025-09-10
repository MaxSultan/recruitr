const AuthFetcherHTTP = require('../services/auth-fetcher-http');

class AuthController {
  /**
   * Get authentication session for a tournament
   */
  async getAuthSession(req, res) {
    try {
      const { tournamentId } = req.params;
      
      if (!tournamentId) {
        return res.status(400).json({
          error: 'Tournament ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`🔐 Getting authentication for tournament ${tournamentId}...`);
      
      const authFetcher = new AuthFetcherHTTP(tournamentId);
      const auth = await authFetcher.call();
      
      console.log(`✅ Authentication successful for tournament ${tournamentId}`);
      
      res.json({
        success: true,
        data: {
          tournamentId,
          sessionId: auth.twSessionId,
          cookie: auth.cookie
        },
        message: 'Authentication successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting authentication:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get authentication',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AuthController();

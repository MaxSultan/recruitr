const seasonAnalyticsService = require('../../services/seasonAnalyticsService');

/**
 * Controller responsible for audit trail operations
 * Single Responsibility: Handle audit trail requests and responses
 */
class AuditTrailController {
  
  /**
   * Get audit trail for a specific season
   * GET /api/season-analytics/:seasonRankingId/audit-trail
   */
  async getAuditTrail(req, res) {
    try {
      const { seasonRankingId } = req.params;
      
      if (!seasonRankingId || isNaN(parseInt(seasonRankingId))) {
        return res.status(400).json({
          error: 'Invalid season ranking ID'
        });
      }

      const auditTrail = await seasonAnalyticsService.getSeasonAuditTrail(parseInt(seasonRankingId));
      
      if (!auditTrail) {
        return res.status(404).json({
          error: 'Season ranking not found'
        });
      }
      
      res.json({
        success: true,
        data: auditTrail
      });
    } catch (error) {
      console.error('Error getting audit trail:', error);
      res.status(500).json({
        error: 'Failed to get audit trail',
        message: error.message
      });
    }
  }
}

module.exports = new AuditTrailController();

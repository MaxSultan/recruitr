const seasonAnalyticsService = require('../../services/seasonAnalyticsService');

/**
 * Controller responsible for analytics calculations
 * Single Responsibility: Handle analytics calculation requests and responses
 */
class AnalyticsController {
  
  /**
   * Calculate and get analytics for a specific season
   * GET /api/season-analytics/:seasonRankingId/analytics
   */
  async getSeasonAnalytics(req, res) {
    try {
      const { seasonRankingId } = req.params;
      
      if (!seasonRankingId || isNaN(parseInt(seasonRankingId))) {
        return res.status(400).json({
          error: 'Invalid season ranking ID'
        });
      }

      const analytics = await seasonAnalyticsService.calculateSeasonAnalytics(parseInt(seasonRankingId));
      
      if (!analytics) {
        return res.status(404).json({
          error: 'Season ranking not found'
        });
      }
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error calculating season analytics:', error);
      res.status(500).json({
        error: 'Failed to calculate season analytics',
        message: error.message
      });
    }
  }

  /**
   * Recalculate analytics for all seasons
   * POST /api/season-analytics/recalculate-all
   */
  async recalculateAllAnalytics(req, res) {
    try {
      const result = await seasonAnalyticsService.recalculateAllSeasonAnalytics();
      
      res.json({
        success: true,
        message: `Successfully recalculated analytics for ${result.success} seasons`,
        data: result
      });
    } catch (error) {
      console.error('Error recalculating all analytics:', error);
      res.status(500).json({
        error: 'Failed to recalculate analytics',
        message: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();

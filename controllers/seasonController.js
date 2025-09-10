const athleteService = require('../services/athleteService');

class SeasonController {
  /**
   * Get a single season by ID
   */
  async getSeasonById(req, res) {
    try {
      const { seasonId } = req.params;
      
      if (!seasonId || isNaN(parseInt(seasonId))) {
        return res.status(400).json({
          error: 'Valid season ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`📅 Fetching season ${seasonId}...`);
      
      const season = await athleteService.getSeasonById(parseInt(seasonId));
      
      if (!season) {
        return res.status(404).json({
          error: 'Season not found',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Found season: ${season.year} ${season.weightClass}lbs`);
      
      res.json({
        success: true,
        data: season,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error fetching season:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch season',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update an existing season
   */
  async updateSeason(req, res) {
    try {
      const { seasonId } = req.params;
      const updateData = req.body;
      
      if (!seasonId || isNaN(parseInt(seasonId))) {
        return res.status(400).json({
          error: 'Valid season ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`📅 Updating season ${seasonId}...`);
      
      const season = await athleteService.updateSeason(parseInt(seasonId), updateData);
      
      if (!season) {
        return res.status(404).json({
          error: 'Season not found',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Updated season: ${season.year} ${season.weightClass}lbs`);
      
      res.json({
        success: true,
        data: season,
        message: 'Season updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error updating season:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update season',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Delete a season
   */
  async deleteSeason(req, res) {
    try {
      const { seasonId } = req.params;
      
      if (!seasonId || isNaN(parseInt(seasonId))) {
        return res.status(400).json({
          error: 'Valid season ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`🗑️ Deleting season ${seasonId}...`);
      
      const deleted = await athleteService.deleteSeason(parseInt(seasonId));
      
      if (!deleted) {
        return res.status(404).json({
          error: 'Season not found',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Deleted season ${seasonId}`);
      
      res.json({
        success: true,
        message: 'Season deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error deleting season:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete season',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new SeasonController();

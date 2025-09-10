const athleteService = require('../services/athleteService');

class AthleteController {
  /**
   * Search athletes by name
   */
  async searchAthletes(req, res) {
    try {
      const { q: query } = req.query;
      
      console.log(`🔍 Searching athletes with query: "${query}"`);
      
      const athletes = await athleteService.searchAthletes(query);
      
      console.log(`✅ Found ${athletes.length} athletes`);
      
      res.json({
        success: true,
        data: athletes,
        count: athletes.length,
        query: query || '',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error searching athletes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search athletes',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get athlete by ID with all seasons
   */
  async getAthleteById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Valid athlete ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`👤 Fetching athlete ${id}...`);
      
      const athlete = await athleteService.getAthleteWithSeasons(parseInt(id));
      
      if (!athlete) {
        return res.status(404).json({
          error: 'Athlete not found',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Found athlete: ${athlete.firstName} ${athlete.lastName}`);
      
      res.json({
        success: true,
        data: athlete,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error fetching athlete:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch athlete',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Toggle athlete favorite status
   */
  async toggleFavorite(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Valid athlete ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`⭐ Toggling favorite status for athlete ${id}...`);
      
      const athlete = await athleteService.toggleFavorite(parseInt(id));
      
      if (!athlete) {
        return res.status(404).json({
          error: 'Athlete not found',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Updated favorite status for ${athlete.firstName} ${athlete.lastName}: ${athlete.isFavorite ? 'favorited' : 'unfavorited'}`);
      
      res.json({
        success: true,
        data: athlete,
        message: `Athlete ${athlete.isFavorite ? 'added to' : 'removed from'} favorites`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle favorite status',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Create a new season for an athlete
   */
  async createSeason(req, res) {
    try {
      const { athleteId } = req.params;
      const seasonData = req.body;
      
      if (!athleteId || isNaN(parseInt(athleteId))) {
        return res.status(400).json({
          error: 'Valid athlete ID is required',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`📅 Creating season for athlete ${athleteId}...`);
      
      const season = await athleteService.createSeason(parseInt(athleteId), seasonData);
      
      console.log(`✅ Created season for athlete ${athleteId}: ${season.year} ${season.weightClass}lbs`);
      
      res.status(201).json({
        success: true,
        data: season,
        message: 'Season created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error creating season:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create season',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Merge two athletes
   */
  async mergeAthletes(req, res) {
    try {
      const { keepAthleteId, mergeAthleteId } = req.body;
      
      if (!keepAthleteId || !mergeAthleteId) {
        return res.status(400).json({
          error: 'Both keepAthleteId and mergeAthleteId are required',
          timestamp: new Date().toISOString()
        });
      }
      
      if (keepAthleteId === mergeAthleteId) {
        return res.status(400).json({
          error: 'Cannot merge athlete with itself',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`🔄 Merging athlete ${mergeAthleteId} into ${keepAthleteId}...`);
      
      const result = await athleteService.mergeAthletes(parseInt(keepAthleteId), parseInt(mergeAthleteId));
      
      console.log(`✅ Successfully merged athletes. Kept: ${result.keptAthlete.firstName} ${result.keptAthlete.lastName}, Merged: ${result.mergedAthlete.firstName} ${result.mergedAthlete.lastName}`);
      
      res.json({
        success: true,
        data: result,
        message: 'Athletes merged successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error merging athletes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to merge athletes',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AthleteController();

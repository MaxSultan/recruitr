const { Athlete, Season } = require('../models');
const { Op } = require('sequelize');

class AthleteService {
  /**
   * Find or create an athlete by first name and last name
   * Optionally filter by state if provided
   */
  async findOrCreateAthlete(firstName, lastName, state = null) {
    try {
      const whereClause = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      // If state is provided, only look for athletes from that state
      if (state) {
        whereClause.state = state;
      }

      let athlete = await Athlete.findOne({
        where: whereClause,
      });

      // If still not found, create new athlete
      if (!athlete) {
        athlete = await Athlete.create({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          state: state || null,
        });
        console.log(`✅ Created new athlete: ${firstName} ${lastName}${state ? ` (${state})` : ''}`);
      } else {
        console.log(`🔍 Found existing athlete: ${firstName} ${lastName} (ID: ${athlete.id})`);
      }

      return athlete;
    } catch (error) {
      console.error(`❌ Error finding/creating athlete ${firstName} ${lastName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new season for an athlete
   * Handles duplicate prevention
   */
  async createSeason(athleteId, seasonData) {
    try {
      const {
        wins,
        losses,
        place: statePlacement,
        pointsScored,
        team,
        year,
        weightClass,
        division,
        grade,
      } = seasonData;

      // Check if season already exists (prevent duplicates)
      const existingSeason = await Season.findOne({
        where: {
          athleteId,
          tournamentId: seasonData.tournamentId,
        },
      });

      if (existingSeason) {
        console.log(`⚠️  Season already exists for athlete ID ${athleteId} (${year}, ${weightClass || 'N/A'}, ${team})`);
        
        // Update existing season with new data
        await existingSeason.update({
          wins,
          losses,
          statePlacement,
          pointsScored,
          division,
          grade,
        });
        
        console.log(`🔄 Updated existing season for athlete ID ${athleteId}`);
        return { season: existingSeason, wasCreated: false };
      } else {
        console.log(`🔍 No existing season found for athlete ID ${athleteId}, tournament ${seasonData.tournamentId}`);
      }

      // Create new season
      const season = await Season.create({
        athleteId,
        wins,
        losses,
        statePlacement,
        pointsScored,
        team,
        year,
        weightClass,
        division,
        grade,
        tournamentId: seasonData.tournamentId || null,
      });

      console.log(`✅ Created new season for athlete ID ${athleteId}: ${year} ${weightClass || 'N/A'} (${wins}-${losses})`);
      return { season, wasCreated: true };
    } catch (error) {
      console.error(`❌ Error creating season for athlete ID ${athleteId}:`, error);
      throw error;
    }
  }

  /**
   * Process tournament results and save to database
   */
  async processTournamentResults(results, state = null, tournamentId = null) {
    const processedResults = [];
    let createdAthletes = 0;
    let createdSeasons = 0;
    let updatedSeasons = 0;

    console.log(`🏁 Processing ${results.length} tournament results...`);

    for (const result of results) {
      try {
        const { firstName, lastName, ...seasonData } = result;

        // Skip if missing required data
        if (!firstName || !lastName) {
          console.log(`⚠️  Skipping result with missing name data:`, result);
          continue;
        }

        // Find or create athlete
        const athlete = await this.findOrCreateAthlete(firstName, lastName, state);
        
        if (athlete.createdAt === athlete.updatedAt) {
          createdAthletes++;
        }

        // Create season (include tournament ID)
        const { season, wasCreated } = await this.createSeason(athlete.id, { ...seasonData, tournamentId });
        
        if (wasCreated) {
          createdSeasons++;
        } else {
          updatedSeasons++;
        }

        processedResults.push({
          athlete: {
            id: athlete.id,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            state: athlete.state,
          },
          season: {
            id: season.id,
            wins: season.wins,
            losses: season.losses,
            statePlacement: season.statePlacement,
            pointsScored: season.pointsScored,
            team: season.team,
            year: season.year,
            weightClass: season.weightClass,
            division: season.division,
          },
        });
      } catch (error) {
        console.error(`❌ Error processing result for ${result.firstName} ${result.lastName}:`, error);
        // Continue processing other results
      }
    }

    console.log(`✅ Processing complete:`);
    console.log(`   📊 ${processedResults.length} results processed`);
    console.log(`   👤 ${createdAthletes} new athletes created`);
    console.log(`   🏆 ${createdSeasons} new seasons created`);
    console.log(`   🔄 ${updatedSeasons} seasons updated`);

    return {
      results: processedResults,
      stats: {
        processed: processedResults.length,
        createdAthletes,
        createdSeasons,
        updatedSeasons,
      },
    };
  }

  /**
   * Get athlete with all seasons
   */
  async getAthleteWithSeasons(athleteId) {
    try {
      const athlete = await Athlete.findByPk(athleteId, {
        include: [{
          model: Season,
          as: 'seasons',
        }],
        order: [[{ model: Season, as: 'seasons' }, 'year', 'DESC']],
      });

      return athlete;
    } catch (error) {
      console.error(`❌ Error fetching athlete ${athleteId}:`, error);
      throw error;
    }
  }

  /**
   * Search athletes by name
   */
  async searchAthletes(query) {
    try {
      let whereClause = {};
      
      // If query is provided, add search conditions
      if (query && query.trim()) {
        whereClause = {
          [Op.or]: [
            {
              firstName: {
                [Op.iLike]: `%${query}%`,
              },
            },
            {
              lastName: {
                [Op.iLike]: `%${query}%`,
              },
            },
          ],
        };
      }
      
      const athletes = await Athlete.findAll({
        where: whereClause,
        include: [{
          model: Season,
          as: 'seasons',
        }],
        order: [
          ['lastName', 'ASC'], 
          ['firstName', 'ASC'],
          [{ model: Season, as: 'seasons' }, 'year', 'DESC']
        ],
      });

      return athletes;
    } catch (error) {
      console.error(`❌ Error searching athletes:`, error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for an athlete
   */
  async toggleFavorite(athleteId) {
    try {
      const athlete = await Athlete.findByPk(athleteId);
      
      if (!athlete) {
        return null;
      }

      // Toggle the favorite status
      athlete.isFavorite = !athlete.isFavorite;
      await athlete.save();

      console.log(`✅ Toggled favorite for ${athlete.firstName} ${athlete.lastName} to ${athlete.isFavorite}`);
      return athlete;
    } catch (error) {
      console.error(`❌ Error toggling favorite for athlete ${athleteId}:`, error);
      throw error;
    }
  }

  /**
   * Merge two athletes - move all seasons from mergeAthlete to keepAthlete, then delete mergeAthlete
   */
  async mergeAthletes(keepAthleteId, mergeAthleteId) {
    const transaction = await Athlete.sequelize.transaction();
    
    try {
      // Get both athletes with their seasons
      const [keepAthlete, mergeAthlete] = await Promise.all([
        Athlete.findByPk(keepAthleteId, {
          include: [{
            model: Season,
            as: 'seasons'
          }]
        }),
        Athlete.findByPk(mergeAthleteId, {
          include: [{
            model: Season,
            as: 'seasons'
          }]
        })
      ]);

      if (!keepAthlete || !mergeAthlete) {
        await transaction.rollback();
        return null;
      }

      console.log(`🔄 Merging ${mergeAthlete.firstName} ${mergeAthlete.lastName} (${mergeAthlete.seasons.length} seasons) into ${keepAthlete.firstName} ${keepAthlete.lastName} (${keepAthlete.seasons.length} seasons)`);

      // Move all seasons from mergeAthlete to keepAthlete
      const seasonsToMove = await Season.findAll({
        where: { athleteId: mergeAthleteId },
        transaction
      });

      await Season.update(
        { athleteId: keepAthleteId },
        { 
          where: { athleteId: mergeAthleteId },
          transaction 
        }
      );

      // If mergeAthlete is favorited but keepAthlete isn't, preserve the favorite status
      if (mergeAthlete.isFavorite && !keepAthlete.isFavorite) {
        keepAthlete.isFavorite = true;
        await keepAthlete.save({ transaction });
      }

      // Delete the merged athlete
      await mergeAthlete.destroy({ transaction });

      await transaction.commit();

      console.log(`✅ Successfully merged athletes. Moved ${seasonsToMove.length} seasons from ${mergeAthlete.firstName} ${mergeAthlete.lastName} to ${keepAthlete.firstName} ${keepAthlete.lastName}`);

      // Return the updated athlete with all seasons
      const updatedAthlete = await this.getAthleteWithSeasons(keepAthleteId);

      return {
        athlete: updatedAthlete,
        mergedSeasons: seasonsToMove.length,
        deletedAthlete: {
          id: mergeAthlete.id,
          firstName: mergeAthlete.firstName,
          lastName: mergeAthlete.lastName
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error(`❌ Error merging athletes ${keepAthleteId} and ${mergeAthleteId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing season
   */
  async updateSeason(seasonId, updateData) {
    try {
      const season = await Season.findByPk(seasonId);
      
      if (!season) {
        return null;
      }

      // Update the season with provided data
      await season.update(updateData);
      
      // Return the updated season with athlete information
      const updatedSeason = await Season.findByPk(seasonId, {
        include: [{
          model: Athlete,
          as: 'athlete'
        }]
      });

      console.log(`✅ Updated season ${seasonId} for athlete ${updatedSeason.athlete.firstName} ${updatedSeason.athlete.lastName}`);
      return updatedSeason;
    } catch (error) {
      console.error(`❌ Error updating season ${seasonId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new season
   */
  async createNewSeason(athleteId, seasonData) {
    try {
      // Check if athlete exists
      const athlete = await Athlete.findByPk(athleteId);
      if (!athlete) {
        return { error: 'Athlete not found' };
      }

      // Create the new season
      const newSeason = await Season.create({
        athleteId,
        ...seasonData
      });

      // Return the new season with athlete information
      const seasonWithAthlete = await Season.findByPk(newSeason.id, {
        include: [{
          model: Athlete,
          as: 'athlete'
        }]
      });

      console.log(`✅ Created new season for athlete ${athlete.firstName} ${athlete.lastName}: ${seasonData.year} ${seasonData.weightClass}`);
      return seasonWithAthlete;
    } catch (error) {
      console.error(`❌ Error creating season for athlete ${athleteId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a season
   */
  async deleteSeason(seasonId) {
    try {
      const season = await Season.findByPk(seasonId, {
        include: [{
          model: Athlete,
          as: 'athlete'
        }]
      });
      
      if (!season) {
        return null;
      }

      const athleteName = `${season.athlete.firstName} ${season.athlete.lastName}`;
      const seasonInfo = `${season.year} ${season.weightClass}`;
      
      await season.destroy();
      
      console.log(`✅ Deleted season ${seasonInfo} for athlete ${athleteName}`);
      return { 
        success: true, 
        deletedSeason: {
          id: seasonId,
          athlete: athleteName,
          year: season.year,
          weightClass: season.weightClass
        }
      };
    } catch (error) {
      console.error(`❌ Error deleting season ${seasonId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single season by ID
   */
  async getSeasonById(seasonId) {
    try {
      const season = await Season.findByPk(seasonId, {
        include: [{
          model: Athlete,
          as: 'athlete'
        }]
      });
      
      return season;
    } catch (error) {
      console.error(`❌ Error getting season ${seasonId}:`, error);
      throw error;
    }
  }

  /**
   * Find a season by athlete ID and year
   */
  async findSeasonByAthleteAndYear(athleteId, year) {
    try {
      const season = await Season.findOne({
        where: {
          athleteId: athleteId,
          year: year.toString()
        }
      });

      return season;
    } catch (error) {
      console.error(`❌ Error finding season for athlete ${athleteId} and year ${year}:`, error);
      throw error;
    }
  }

  /**
   * Find a season by exact match (athlete, year, weight, team, tournament)
   */
  async findSeasonByExactMatch(athleteId, year, weightClass, team, tournamentId) {
    try {
      const season = await Season.findOne({
        where: {
          athleteId: athleteId,
          year: year.toString(),
          weightClass: weightClass,
          team: team,
          tournamentId: tournamentId
        }
      });

      return season;
    } catch (error) {
      console.error(`❌ Error finding exact season match:`, error);
      throw error;
    }
  }

}

module.exports = new AthleteService();

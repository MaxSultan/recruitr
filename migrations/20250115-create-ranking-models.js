'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create SeasonRankings table
    await queryInterface.createTable('SeasonRankings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      athleteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'id'
        }
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      weightClass: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      team: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      division: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      grade: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      wins: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      losses: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      winPercentage: {
        type: Sequelize.DECIMAL(5, 3),
        allowNull: false,
        defaultValue: 0.000
      },
      finalElo: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      finalGlickoRating: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      finalGlickoRd: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      finalGlickoVolatility: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true
      },
      statePlacement: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      pointsScored: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      tournamentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      firstMatchDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastMatchDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      totalMatches: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      peakElo: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      peakEloDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lowestElo: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      lowestEloDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      peakGlickoRating: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      peakGlickoDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      seasonComplete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      seasonStartDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      seasonEndDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create RankingMatches table
    await queryInterface.createTable('RankingMatches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      seasonRankingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'SeasonRankings',
          key: 'id'
        }
      },
      athleteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'id'
        }
      },
      opponentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'id'
        }
      },
      matchResult: {
        type: Sequelize.ENUM('win', 'loss'),
        allowNull: false
      },
      resultType: {
        type: Sequelize.ENUM('decision', 'major-decision', 'technical-fall', 'fall'),
        allowNull: false
      },
      weight: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      matchDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      tournamentType: {
        type: Sequelize.ENUM('local', 'district', 'regional', 'state', 'national'),
        allowNull: false,
        defaultValue: 'local'
      },
      sourceUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      matchHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      eloBefore: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      eloAfter: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      eloChange: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      glickoRatingBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      glickoRatingAfter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      glickoRatingChange: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      glickoRdBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      glickoRdAfter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      glickoRdChange: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      glickoVolatilityBefore: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      glickoVolatilityAfter: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      glickoVolatilityChange: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      winsBefore: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      lossesBefore: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      winsAfter: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      lossesAfter: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for SeasonRankings
    await queryInterface.addIndex('SeasonRankings', ['athleteId', 'year', 'weightClass', 'team', 'tournamentId'], {
      unique: true,
      name: 'unique_athlete_season_ranking'
    });

    await queryInterface.addIndex('SeasonRankings', ['athleteId'], {
      name: 'idx_season_rankings_athlete'
    });

    await queryInterface.addIndex('SeasonRankings', ['year'], {
      name: 'idx_season_rankings_year'
    });

    await queryInterface.addIndex('SeasonRankings', ['finalElo'], {
      name: 'idx_season_rankings_final_elo'
    });

    await queryInterface.addIndex('SeasonRankings', ['finalGlickoRating'], {
      name: 'idx_season_rankings_final_glicko'
    });

    // Create indexes for RankingMatches
    await queryInterface.addIndex('RankingMatches', ['matchHash'], {
      unique: true,
      name: 'unique_ranking_match_hash'
    });

    await queryInterface.addIndex('RankingMatches', ['seasonRankingId'], {
      name: 'idx_ranking_matches_season'
    });

    await queryInterface.addIndex('RankingMatches', ['athleteId'], {
      name: 'idx_ranking_matches_athlete'
    });

    await queryInterface.addIndex('RankingMatches', ['matchDate'], {
      name: 'idx_ranking_matches_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('RankingMatches');
    await queryInterface.dropTable('SeasonRankings');
  }
};

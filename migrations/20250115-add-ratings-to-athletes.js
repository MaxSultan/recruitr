'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add rating fields to athletes table
    await queryInterface.addColumn('athletes', 'elo', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1500,
      comment: 'Current ELO rating'
    });

    await queryInterface.addColumn('athletes', 'glickoRating', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1500,
      comment: 'Current Glicko rating'
    });

    await queryInterface.addColumn('athletes', 'glickoRd', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 200,
      comment: 'Current Glicko Rating Deviation'
    });

    await queryInterface.addColumn('athletes', 'glickoVolatility', {
      type: Sequelize.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0.06,
      comment: 'Current Glicko volatility'
    });

    await queryInterface.addColumn('athletes', 'wins', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of wins'
    });

    await queryInterface.addColumn('athletes', 'losses', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of losses'
    });

    await queryInterface.addColumn('athletes', 'lastMatchDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of most recent match'
    });

    // Create matches table
    await queryInterface.createTable('Matches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      winnerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'id'
        }
      },
      loserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'id'
        }
      },
      result: {
        type: Sequelize.ENUM('decision', 'major-decision', 'technical-fall', 'fall'),
        allowNull: false
      },
      weight: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Weight class in pounds'
      },
      date: {
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
        allowNull: true,
        comment: 'URL where the match data was scraped from'
      },
      matchHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Hash for deduplication - prevents processing same match twice'
      },
      winnerEloBefore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Winner ELO rating before the match'
      },
      winnerEloAfter: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Winner ELO rating after the match'
      },
      loserEloBefore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Loser ELO rating before the match'
      },
      loserEloAfter: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Loser ELO rating after the match'
      },
      winnerGlickoRatingBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Winner Glicko rating before the match'
      },
      winnerGlickoRatingAfter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Winner Glicko rating after the match'
      },
      winnerGlickoRdBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Winner Glicko RD before the match'
      },
      winnerGlickoRdAfter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Winner Glicko RD after the match'
      },
      loserGlickoRatingBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Loser Glicko rating before the match'
      },
      loserGlickoRatingAfter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Loser Glicko rating after the match'
      },
      loserGlickoRdBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Loser Glicko RD before the match'
      },
      loserGlickoRdAfter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Loser Glicko RD after the match'
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

    // Create indexes for matches table
    await queryInterface.addIndex('Matches', ['matchHash'], {
      unique: true,
      name: 'unique_match_hash'
    });

    await queryInterface.addIndex('Matches', ['winnerId'], {
      name: 'idx_matches_winner'
    });

    await queryInterface.addIndex('Matches', ['loserId'], {
      name: 'idx_matches_loser'
    });

    await queryInterface.addIndex('Matches', ['date'], {
      name: 'idx_matches_date'
    });

    await queryInterface.addIndex('Matches', ['tournamentType'], {
      name: 'idx_matches_tournament_type'
    });

    await queryInterface.addIndex('Matches', ['result'], {
      name: 'idx_matches_result'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop matches table
    await queryInterface.dropTable('Matches');

    // Remove rating fields from athletes table
    await queryInterface.removeColumn('athletes', 'elo');
    await queryInterface.removeColumn('athletes', 'glickoRating');
    await queryInterface.removeColumn('athletes', 'glickoRd');
    await queryInterface.removeColumn('athletes', 'glickoVolatility');
    await queryInterface.removeColumn('athletes', 'wins');
    await queryInterface.removeColumn('athletes', 'losses');
    await queryInterface.removeColumn('athletes', 'lastMatchDate');
  }
};

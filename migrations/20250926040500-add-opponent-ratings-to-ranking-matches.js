'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add opponent rating tracking fields to RankingMatches table
    await queryInterface.addColumn('RankingMatches', 'opponentEloAtTime', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Opponent ELO rating at the time of this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentEloBefore', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Opponent ELO rating before this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentEloAfter', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Opponent ELO rating after this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentCurrentElo', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Opponent current ELO rating (for retroactive analysis)'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentGlickoAtTime', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent Glicko rating at the time of this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentGlickoBefore', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent Glicko rating before this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentGlickoAfter', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent Glicko rating after this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentCurrentGlicko', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent current Glicko rating (for retroactive analysis)'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentGlickoRdAtTime', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent Glicko RD at the time of this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentGlickoRdBefore', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent Glicko RD before this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentGlickoRdAfter', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent Glicko RD after this match'
    });

    await queryInterface.addColumn('RankingMatches', 'opponentCurrentGlickoRd', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Opponent current Glicko RD (for retroactive analysis)'
    });

    // Add athlete rating at time fields
    await queryInterface.addColumn('RankingMatches', 'athleteEloAtTime', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Athlete ELO rating at the time of this match'
    });

    await queryInterface.addColumn('RankingMatches', 'athleteGlickoAtTime', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Athlete Glicko rating at the time of this match'
    });

    await queryInterface.addColumn('RankingMatches', 'athleteGlickoRdAtTime', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Athlete Glicko RD at the time of this match'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove opponent rating tracking fields
    await queryInterface.removeColumn('RankingMatches', 'opponentEloAtTime');
    await queryInterface.removeColumn('RankingMatches', 'opponentEloBefore');
    await queryInterface.removeColumn('RankingMatches', 'opponentEloAfter');
    await queryInterface.removeColumn('RankingMatches', 'opponentCurrentElo');
    await queryInterface.removeColumn('RankingMatches', 'opponentGlickoAtTime');
    await queryInterface.removeColumn('RankingMatches', 'opponentGlickoBefore');
    await queryInterface.removeColumn('RankingMatches', 'opponentGlickoAfter');
    await queryInterface.removeColumn('RankingMatches', 'opponentCurrentGlicko');
    await queryInterface.removeColumn('RankingMatches', 'opponentGlickoRdAtTime');
    await queryInterface.removeColumn('RankingMatches', 'opponentGlickoRdBefore');
    await queryInterface.removeColumn('RankingMatches', 'opponentGlickoRdAfter');
    await queryInterface.removeColumn('RankingMatches', 'opponentCurrentGlickoRd');

    // Remove athlete rating at time fields
    await queryInterface.removeColumn('RankingMatches', 'athleteEloAtTime');
    await queryInterface.removeColumn('RankingMatches', 'athleteGlickoAtTime');
    await queryInterface.removeColumn('RankingMatches', 'athleteGlickoRdAtTime');
  }
};

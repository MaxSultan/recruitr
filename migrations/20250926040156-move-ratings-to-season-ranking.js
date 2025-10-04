'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, add the new analytics fields to SeasonRankings table
    await queryInterface.addColumn('SeasonRankings', 'strengthOfSchedule', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average ELO rating of opponents faced during the season'
    });

    await queryInterface.addColumn('SeasonRankings', 'strengthOfRecord', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Weighted record strength based on opponent quality and results'
    });

    await queryInterface.addColumn('SeasonRankings', 'strengthOfScheduleAtTime', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average opponent ELO at the time each match was wrestled'
    });

    await queryInterface.addColumn('SeasonRankings', 'strengthOfScheduleLatest', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average current ELO rating of opponents (retroactive quality)'
    });

    await queryInterface.addColumn('SeasonRankings', 'glickoStrengthOfSchedule', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average Glicko rating of opponents faced during the season'
    });

    await queryInterface.addColumn('SeasonRankings', 'glickoStrengthOfScheduleAtTime', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average opponent Glicko rating at the time each match was wrestled'
    });

    await queryInterface.addColumn('SeasonRankings', 'glickoStrengthOfScheduleLatest', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average current Glicko rating of opponents (retroactive quality)'
    });

    await queryInterface.addColumn('SeasonRankings', 'averageOpponentElo', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average ELO of all opponents faced'
    });

    await queryInterface.addColumn('SeasonRankings', 'averageOpponentGlicko', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Average Glicko rating of all opponents faced'
    });

    await queryInterface.addColumn('SeasonRankings', 'toughestOpponentElo', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Highest ELO opponent faced during the season'
    });

    await queryInterface.addColumn('SeasonRankings', 'weakestOpponentElo', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Lowest ELO opponent faced during the season'
    });

    await queryInterface.addColumn('SeasonRankings', 'qualityWins', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of wins against opponents with ELO > 1600'
    });

    await queryInterface.addColumn('SeasonRankings', 'qualityLosses', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of losses against opponents with ELO < 1400'
    });

    await queryInterface.addColumn('SeasonRankings', 'upsetWins', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of wins against opponents with higher ELO'
    });

    await queryInterface.addColumn('SeasonRankings', 'upsetLosses', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of losses against opponents with lower ELO'
    });

    // Now remove the rating fields from Athletes table
    await queryInterface.removeColumn('athletes', 'elo');
    await queryInterface.removeColumn('athletes', 'glickoRating');
    await queryInterface.removeColumn('athletes', 'glickoRd');
    await queryInterface.removeColumn('athletes', 'glickoVolatility');
    await queryInterface.removeColumn('athletes', 'wins');
    await queryInterface.removeColumn('athletes', 'losses');
    await queryInterface.removeColumn('athletes', 'lastMatchDate');
  },

  async down (queryInterface, Sequelize) {
    // Restore rating fields to Athletes table
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

    // Remove the analytics fields from SeasonRankings table
    await queryInterface.removeColumn('SeasonRankings', 'strengthOfSchedule');
    await queryInterface.removeColumn('SeasonRankings', 'strengthOfRecord');
    await queryInterface.removeColumn('SeasonRankings', 'strengthOfScheduleAtTime');
    await queryInterface.removeColumn('SeasonRankings', 'strengthOfScheduleLatest');
    await queryInterface.removeColumn('SeasonRankings', 'glickoStrengthOfSchedule');
    await queryInterface.removeColumn('SeasonRankings', 'glickoStrengthOfScheduleAtTime');
    await queryInterface.removeColumn('SeasonRankings', 'glickoStrengthOfScheduleLatest');
    await queryInterface.removeColumn('SeasonRankings', 'averageOpponentElo');
    await queryInterface.removeColumn('SeasonRankings', 'averageOpponentGlicko');
    await queryInterface.removeColumn('SeasonRankings', 'toughestOpponentElo');
    await queryInterface.removeColumn('SeasonRankings', 'weakestOpponentElo');
    await queryInterface.removeColumn('SeasonRankings', 'qualityWins');
    await queryInterface.removeColumn('SeasonRankings', 'qualityLosses');
    await queryInterface.removeColumn('SeasonRankings', 'upsetWins');
    await queryInterface.removeColumn('SeasonRankings', 'upsetLosses');
  }
};

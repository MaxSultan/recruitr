const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const SeasonRanking = sequelize.define('SeasonRanking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  athleteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'athletes',
      key: 'id'
    },
    comment: 'Reference to the athlete'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Year of the season (e.g., 2024)'
  },
  weightClass: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Weight class for this season (e.g., "145 lbs", "160 lbs")'
  },
  team: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Team/school name'
  },
  division: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Division (e.g., "1A", "2A", "3A", etc.)'
  },
  grade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Grade level (9, 10, 11, 12)'
  },
  // Season Statistics
  wins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total wins for the season'
  },
  losses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total losses for the season'
  },
  winPercentage: {
    type: DataTypes.DECIMAL(5, 3),
    allowNull: false,
    defaultValue: 0.000,
    comment: 'Win percentage for the season'
  },
  // Final Rankings
  finalElo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Final ELO rating at end of season'
  },
  finalGlickoRating: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Final Glicko rating at end of season'
  },
  finalGlickoRd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Final Glicko Rating Deviation at end of season'
  },
  finalGlickoVolatility: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: 'Final Glicko volatility at end of season'
  },
  // Season Performance
  statePlacement: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Placement at state tournament (1st, 2nd, 3rd, etc.)'
  },
  pointsScored: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Total points scored during the season'
  },
  // Tournament Information
  tournamentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Reference to tournament if this is tournament-specific data'
  },
  // Tracking
  firstMatchDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of first match in this season'
  },
  lastMatchDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of last match in this season'
  },
  totalMatches: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of matches in this season'
  },
  // Ranking Evolution Tracking
  peakElo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Highest ELO rating achieved during the season'
  },
  peakEloDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when peak ELO was achieved'
  },
  lowestElo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Lowest ELO rating during the season'
  },
  lowestEloDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when lowest ELO was achieved'
  },
  peakGlickoRating: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Highest Glicko rating achieved during the season'
  },
  peakGlickoDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when peak Glicko rating was achieved'
  },
  // Season Status
  seasonComplete: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the season is complete'
  },
  seasonStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Official start date of the season'
  },
  seasonEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Official end date of the season'
  },
  
  // Strength of Schedule Analytics
  strengthOfSchedule: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average ELO rating of opponents faced during the season'
  },
  strengthOfRecord: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Weighted record strength based on opponent quality and results'
  },
  strengthOfScheduleAtTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average opponent ELO at the time each match was wrestled'
  },
  strengthOfScheduleLatest: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average current ELO rating of opponents (retroactive quality)'
  },
  
  // Glicko-based Strength Metrics
  glickoStrengthOfSchedule: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average Glicko rating of opponents faced during the season'
  },
  glickoStrengthOfScheduleAtTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average opponent Glicko rating at the time each match was wrestled'
  },
  glickoStrengthOfScheduleLatest: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average current Glicko rating of opponents (retroactive quality)'
  },
  
  // Opponent Analysis
  averageOpponentElo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average ELO of all opponents faced'
  },
  averageOpponentGlicko: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Average Glicko rating of all opponents faced'
  },
  toughestOpponentElo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Highest ELO opponent faced during the season'
  },
  weakestOpponentElo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Lowest ELO opponent faced during the season'
  },
  
  // Quality Metrics
  qualityWins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of wins against opponents with ELO > 1600'
  },
  qualityLosses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of losses against opponents with ELO < 1400'
  },
  upsetWins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of wins against opponents with higher ELO'
  },
  upsetLosses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of losses against opponents with lower ELO'
  }
}, {
  tableName: 'SeasonRankings',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['athleteId', 'year', 'weightClass', 'team', 'tournamentId'],
      name: 'unique_athlete_season_ranking'
    },
    {
      fields: ['athleteId'],
      name: 'idx_season_rankings_athlete'
    },
    {
      fields: ['year'],
      name: 'idx_season_rankings_year'
    },
    {
      fields: ['weightClass'],
      name: 'idx_season_rankings_weight_class'
    },
    {
      fields: ['team'],
      name: 'idx_season_rankings_team'
    },
    {
      fields: ['division'],
      name: 'idx_season_rankings_division'
    },
    {
      fields: ['finalElo'],
      name: 'idx_season_rankings_final_elo'
    },
    {
      fields: ['finalGlickoRating'],
      name: 'idx_season_rankings_final_glicko'
    },
    {
      fields: ['statePlacement'],
      name: 'idx_season_rankings_placement'
    },
    {
      fields: ['seasonComplete'],
      name: 'idx_season_rankings_complete'
    }
  ]
});

module.exports = SeasonRanking;

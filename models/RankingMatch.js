const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const RankingMatch = sequelize.define('RankingMatch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  seasonRankingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SeasonRankings',
      key: 'id'
    },
    comment: 'Reference to the season ranking this match belongs to'
  },
  athleteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'athletes',
      key: 'id'
    },
    comment: 'The athlete whose ranking is being updated'
  },
  opponentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'athletes',
      key: 'id'
    },
    comment: 'The opponent in this match'
  },
  matchResult: {
    type: DataTypes.ENUM('win', 'loss'),
    allowNull: false,
    comment: 'Whether the athlete won or lost this match'
  },
  resultType: {
    type: DataTypes.ENUM('decision', 'major-decision', 'technical-fall', 'fall'),
    allowNull: false,
    comment: 'Type of win/loss (decision, major, tech, fall)'
  },
  weight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Weight class in pounds'
  },
  matchDate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Date when the match occurred'
  },
  tournamentType: {
    type: DataTypes.ENUM('local', 'district', 'regional', 'state', 'national'),
    allowNull: false,
    defaultValue: 'local',
    comment: 'Type of tournament/event'
  },
  sourceUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL where the match data was scraped from'
  },
  matchHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Hash for deduplication - prevents processing same match twice'
  },
  // ELO Rating Tracking
  eloBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ELO rating before this match'
  },
  eloAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ELO rating after this match'
  },
  eloChange: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Change in ELO rating (+ or -)'
  },
  // Glicko Rating Tracking
  glickoRatingBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Glicko rating before this match'
  },
  glickoRatingAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Glicko rating after this match'
  },
  glickoRatingChange: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Change in Glicko rating (+ or -)'
  },
  glickoRdBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Glicko Rating Deviation before this match'
  },
  glickoRdAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Glicko Rating Deviation after this match'
  },
  glickoRdChange: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Change in Glicko RD (+ or -)'
  },
  glickoVolatilityBefore: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    comment: 'Glicko volatility before this match'
  },
  glickoVolatilityAfter: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    comment: 'Glicko volatility after this match'
  },
  glickoVolatilityChange: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    comment: 'Change in Glicko volatility (+ or -)'
  },
  // Match Statistics
  winsBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total wins before this match'
  },
  lossesBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total losses before this match'
  },
  winsAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total wins after this match'
  },
  lossesAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total losses after this match'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When this ranking match was processed'
  },
  
  // Opponent Rating Tracking (for strength of schedule calculations)
  opponentEloAtTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Opponent ELO rating at the time of this match'
  },
  opponentEloBefore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Opponent ELO rating before this match'
  },
  opponentEloAfter: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Opponent ELO rating after this match'
  },
  opponentCurrentElo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Opponent current ELO rating (for retroactive analysis)'
  },
  opponentGlickoAtTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent Glicko rating at the time of this match'
  },
  opponentGlickoBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent Glicko rating before this match'
  },
  opponentGlickoAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent Glicko rating after this match'
  },
  opponentCurrentGlicko: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent current Glicko rating (for retroactive analysis)'
  },
  opponentGlickoRdAtTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent Glicko RD at the time of this match'
  },
  opponentGlickoRdBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent Glicko RD before this match'
  },
  opponentGlickoRdAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent Glicko RD after this match'
  },
  opponentCurrentGlickoRd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Opponent current Glicko RD (for retroactive analysis)'
  },
  
  // Athlete Rating at Time of Match (for historical accuracy)
  athleteEloAtTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Athlete ELO rating at the time of this match'
  },
  athleteGlickoAtTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Athlete Glicko rating at the time of this match'
  },
  athleteGlickoRdAtTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Athlete Glicko RD at the time of this match'
  }
}, {
  tableName: 'RankingMatches',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['matchHash'],
      name: 'unique_ranking_match_hash'
    },
    {
      fields: ['seasonRankingId'],
      name: 'idx_ranking_matches_season'
    },
    {
      fields: ['athleteId'],
      name: 'idx_ranking_matches_athlete'
    },
    {
      fields: ['opponentId'],
      name: 'idx_ranking_matches_opponent'
    },
    {
      fields: ['matchDate'],
      name: 'idx_ranking_matches_date'
    },
    {
      fields: ['tournamentType'],
      name: 'idx_ranking_matches_tournament_type'
    },
    {
      fields: ['matchResult'],
      name: 'idx_ranking_matches_result'
    },
    {
      fields: ['resultType'],
      name: 'idx_ranking_matches_result_type'
    }
  ]
});

module.exports = RankingMatch;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  winnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Athletes',
      key: 'id'
    }
  },
  loserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Athletes',
      key: 'id'
    }
  },
  result: {
    type: DataTypes.ENUM('decision', 'major-decision', 'technical-fall', 'fall'),
    allowNull: false
  },
  weight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Weight class in pounds'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  tournamentType: {
    type: DataTypes.ENUM('local', 'district', 'regional', 'state', 'national'),
    allowNull: false,
    defaultValue: 'local'
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
  winnerEloBefore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Winner ELO rating before the match'
  },
  winnerEloAfter: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Winner ELO rating after the match'
  },
  loserEloBefore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Loser ELO rating before the match'
  },
  loserEloAfter: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Loser ELO rating after the match'
  },
  winnerGlickoRatingBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Winner Glicko rating before the match'
  },
  winnerGlickoRatingAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Winner Glicko rating after the match'
  },
  winnerGlickoRdBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Winner Glicko RD before the match'
  },
  winnerGlickoRdAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Winner Glicko RD after the match'
  },
  loserGlickoRatingBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Loser Glicko rating before the match'
  },
  loserGlickoRatingAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Loser Glicko rating after the match'
  },
  loserGlickoRdBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Loser Glicko RD before the match'
  },
  loserGlickoRdAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Loser Glicko RD after the match'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Matches',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['matchHash'],
      name: 'unique_match_hash'
    },
    {
      fields: ['winnerId'],
      name: 'idx_matches_winner'
    },
    {
      fields: ['loserId'],
      name: 'idx_matches_loser'
    },
    {
      fields: ['date'],
      name: 'idx_matches_date'
    },
    {
      fields: ['tournamentType'],
      name: 'idx_matches_tournament_type'
    },
    {
      fields: ['result'],
      name: 'idx_matches_result'
    }
  ]
});

module.exports = Match;

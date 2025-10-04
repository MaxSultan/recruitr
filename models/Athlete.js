const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Athlete = sequelize.define('Athlete', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  state: {
    type: DataTypes.STRING(2),
    allowNull: true,
    comment: 'Two-letter state code (e.g., UT, CA, TX)',
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this athlete is marked as a favorite',
  },
  // Current Rating Fields (from migration)
  elo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1500,
    comment: 'Current ELO rating'
  },
  glickoRating: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1500,
    comment: 'Current Glicko rating'
  },
  glickoRd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 200,
    comment: 'Current Glicko Rating Deviation'
  },
  glickoVolatility: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    defaultValue: 0.06,
    comment: 'Current Glicko volatility'
  },
  wins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of wins'
  },
  losses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of losses'
  },
  lastMatchDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of most recent match'
  }
}, {
  tableName: 'athletes',
  timestamps: true,
  indexes: [
    {
      unique: false,
      fields: ['firstName', 'lastName'],
    },
    {
      unique: false,
      fields: ['state'],
    },
  ],
});

module.exports = Athlete;

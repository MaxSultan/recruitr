const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Season = sequelize.define('Season', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  athleteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'athletes',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  wins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  losses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  statePlacement: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'State tournament placement (e.g., "1st", "2nd", "5th", "is unknown")',
  },
  pointsScored: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
    },
  },
  team: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  year: {
    type: DataTypes.STRING(4),
    allowNull: false,
    validate: {
      notEmpty: true,
      isNumeric: true,
      len: [4, 4],
    },
  },
  weightClass: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Weight class (e.g., "106", "113", "120")',
  },
  division: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Division (e.g., "4A", "5A", "D1")',
  },
  tournamentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Track Wrestling tournament ID where this performance occurred'
  },
  grade: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Grade level during this season (e.g., "9th", "10th", "11th", "12th", "Fr", "So", "Jr", "Sr")'
  },
}, {
  tableName: 'seasons',
  timestamps: true,
  indexes: [
    {
      unique: false,
      fields: ['athleteId'],
    },
    {
      unique: false,
      fields: ['year'],
    },
    {
      unique: false,
      fields: ['team'],
    },
    {
      unique: false,
      fields: ['weightClass'],
    },
    {
      // Composite index to prevent duplicate seasons for same athlete/year/weight/tournament
      unique: true,
      fields: ['athleteId', 'year', 'weightClass', 'team', 'tournamentId'],
      name: 'unique_athlete_season_tournament',
    },
  ],
});

module.exports = Season;

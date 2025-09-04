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

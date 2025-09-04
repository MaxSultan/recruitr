const sequelize = require('../config/sequelize');
const Athlete = require('./Athlete');
const Season = require('./Season');

// Define associations
Athlete.hasMany(Season, {
  foreignKey: 'athleteId',
  as: 'seasons',
});

Season.belongsTo(Athlete, {
  foreignKey: 'athleteId',
  as: 'athlete',
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  Athlete,
  Season,
};

// Function to sync database (create tables)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
    
    if (force) {
      console.log('⚠️  Database tables recreated (all data cleared).');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

module.exports.syncDatabase = syncDatabase;

const sequelize = require('../config/sequelize');
const Athlete = require('./Athlete');
const Season = require('./Season');
const Match = require('./Match');
const SeasonRanking = require('./SeasonRanking');
const RankingMatch = require('./RankingMatch');

// Define associations
Athlete.hasMany(Season, {
  foreignKey: 'athleteId',
  as: 'seasons',
});

Season.belongsTo(Athlete, {
  foreignKey: 'athleteId',
  as: 'athlete',
});

// Match associations
Athlete.hasMany(Match, {
  foreignKey: 'winnerId',
  as: 'matchWins',
});

Athlete.hasMany(Match, {
  foreignKey: 'loserId',
  as: 'matchLosses',
});

Match.belongsTo(Athlete, {
  foreignKey: 'winnerId',
  as: 'winner',
});

Match.belongsTo(Athlete, {
  foreignKey: 'loserId',
  as: 'loser',
});

// SeasonRanking associations
Athlete.hasMany(SeasonRanking, {
  foreignKey: 'athleteId',
  as: 'seasonRankings',
});

SeasonRanking.belongsTo(Athlete, {
  foreignKey: 'athleteId',
  as: 'athlete',
});

// RankingMatch associations
SeasonRanking.hasMany(RankingMatch, {
  foreignKey: 'seasonRankingId',
  as: 'rankingMatches',
});

RankingMatch.belongsTo(SeasonRanking, {
  foreignKey: 'seasonRankingId',
  as: 'seasonRanking',
});

RankingMatch.belongsTo(Athlete, {
  foreignKey: 'athleteId',
  as: 'athlete',
});

RankingMatch.belongsTo(Athlete, {
  foreignKey: 'opponentId',
  as: 'opponent',
});

Athlete.hasMany(RankingMatch, {
  foreignKey: 'athleteId',
  as: 'rankingMatches',
});

Athlete.hasMany(RankingMatch, {
  foreignKey: 'opponentId',
  as: 'opponentMatches',
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  Athlete,
  Season,
  Match,
  SeasonRanking,
  RankingMatch,
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

const { RankingMatch, Athlete } = require('../models');

async function checkDatabaseStatus() {
    console.log('🔍 Checking database status...');
    
    try {
        const matchCount = await RankingMatch.count();
        const athleteCount = await Athlete.count();
        
        console.log(`📊 Database Status:`);
        console.log(`   🥊 Total matches: ${matchCount}`);
        console.log(`   👥 Total athletes: ${athleteCount}`);
        
        if (matchCount > 0) {
            const recentMatches = await RankingMatch.findAll({
                order: [['createdAt', 'DESC']],
                limit: 5,
                include: [{
                    model: Athlete,
                    as: 'athlete',
                    attributes: ['firstName', 'lastName']
                }]
            });
            
            console.log(`\n🏆 Recent matches:`);
            recentMatches.forEach((match, index) => {
                console.log(`   ${index + 1}. ${match.athlete.firstName} ${match.athlete.lastName} - ${match.matchResult} (${match.resultType})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        process.exit(0);
    }
}

checkDatabaseStatus();



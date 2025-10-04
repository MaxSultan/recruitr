const trackwrestlingMatchParser = require('../services/parsers/trackwrestlingMatchParser');
const { Athlete, SeasonRanking } = require('../models');

// Test the full processing pipeline with a simple match
async function testFullPipeline() {
    console.log('🔍 Testing full match processing pipeline...');
    
    // Create a test match that should work
    const testMatch = {
        tournamentRound: null,
        winner: {
            firstName: 'John',
            lastName: 'Smith',
            fullName: 'John Smith',
            school: 'Utah High School'
        },
        loser: {
            firstName: 'Mike',
            lastName: 'Johnson', 
            fullName: 'Mike Johnson',
            school: 'Utah High School'
        },
        result: { 
            type: 'fall', 
            score: null, 
            time: '1:30', 
            raw: 'Fall 1:30' 
        },
        matchType: 'fall',
        weightClass: '145',
        rawText: 'John Smith (Utah High School) over Mike Johnson (Utah High School) (Fall 1:30)'
    };

    const testEvent = { text: 'Test Event' };
    const testTeam = { text: 'Test Team' };

    console.log('📊 Test match:', JSON.stringify(testMatch, null, 2));

    try {
        // Test athlete creation/finding
        console.log('\n🔍 Testing athlete creation...');
        
        const winner = await findOrCreateAthlete(testMatch.winner);
        console.log('✅ Winner athlete:', winner);
        
        const loser = await findOrCreateAthlete(testMatch.loser);
        console.log('✅ Loser athlete:', loser);
        
        // Test season ranking creation/finding
        console.log('\n🔍 Testing season ranking creation...');
        
        const winnerSeason = await findOrCreateSeasonRanking(winner.id, testMatch, testEvent, testTeam);
        console.log('✅ Winner season ranking:', winnerSeason);
        
        const loserSeason = await findOrCreateSeasonRanking(loser.id, testMatch, testEvent, testTeam);
        console.log('✅ Loser season ranking:', loserSeason);
        
        console.log('\n✅ Full pipeline test completed successfully!');
        
    } catch (error) {
        console.error('❌ Pipeline test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

async function findOrCreateAthlete(athleteData) {
    try {
        let athlete = await Athlete.findOne({
            where: {
                firstName: athleteData.firstName,
                lastName: athleteData.lastName
            }
        });

        if (!athlete) {
            athlete = await Athlete.create({
                firstName: athleteData.firstName,
                lastName: athleteData.lastName,
                state: 'UT'
            });
            console.log(`    ✅ Created new athlete: ${athleteData.fullName}`);
        } else {
            console.log(`    ✅ Found existing athlete: ${athleteData.fullName}`);
        }

        return athlete;
    } catch (error) {
        console.error(`❌ Error finding/creating athlete ${athleteData.fullName}:`, error);
        throw error;
    }
}

async function findOrCreateSeasonRanking(athleteId, match, event, team) {
    try {
        let seasonRanking = await SeasonRanking.findOne({
            where: {
                athleteId: athleteId,
                year: 2024
            }
        });

        if (!seasonRanking) {
            seasonRanking = await SeasonRanking.create({
                athleteId: athleteId,
                year: 2024,
                weightClass: match.weightClass,
                team: team.text || 'Unknown Team',
                division: '3A',
                grade: 11,
                wins: 0,
                losses: 0,
                finalElo: 1500,
                finalGlickoRating: 1500,
                finalGlickoRd: 200,
                finalGlickoVolatility: 0.06
            });
            console.log(`    ✅ Created new season ranking for athlete ${athleteId}`);
        } else {
            console.log(`    ✅ Found existing season ranking for athlete ${athleteId}`);
        }

        return seasonRanking;
    } catch (error) {
        console.error(`❌ Error finding/creating season ranking for athlete ${athleteId}:`, error);
        throw error;
    }
}

// Run the test
testFullPipeline().then(() => {
    console.log('✅ Pipeline debug script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


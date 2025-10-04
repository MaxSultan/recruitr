const { Athlete, SeasonRanking, RankingMatch } = require('../models');
const { performEloCalculation } = require('../utilities/perform-elo-calculation');
const { performGlickoCalculation } = require('../utilities/perform-glicko-calculation');

async function createSampleData() {
    console.log('🏗️  Creating sample athletes and matches for testing...');
    
    try {
        // Create sample athletes
        const athletes = await Promise.all([
            Athlete.create({ firstName: 'John', lastName: 'Smith', state: 'UT' }),
            Athlete.create({ firstName: 'Mike', lastName: 'Johnson', state: 'UT' }),
            Athlete.create({ firstName: 'Sarah', lastName: 'Davis', state: 'UT' }),
            Athlete.create({ firstName: 'Chris', lastName: 'Wilson', state: 'UT' }),
            Athlete.create({ firstName: 'Alex', lastName: 'Brown', state: 'UT' })
        ]);
        
        console.log(`✅ Created ${athletes.length} sample athletes`);
        
        // Create sample season rankings
        const seasonRankings = await Promise.all([
            SeasonRanking.create({
                athleteId: athletes[0].id,
                year: 2024,
                weightClass: '145',
                team: 'Utah High School',
                division: '3A',
                grade: 11,
                wins: 0,
                losses: 0,
                finalElo: 1500,
                finalGlickoRating: 1500,
                finalGlickoRd: 200,
                finalGlickoVolatility: 0.06
            }),
            SeasonRanking.create({
                athleteId: athletes[1].id,
                year: 2024,
                weightClass: '145',
                team: 'Utah High School',
                division: '3A',
                grade: 10,
                wins: 0,
                losses: 0,
                finalElo: 1500,
                finalGlickoRating: 1500,
                finalGlickoRd: 200,
                finalGlickoVolatility: 0.06
            }),
            SeasonRanking.create({
                athleteId: athletes[2].id,
                year: 2024,
                weightClass: '135',
                team: 'Utah High School',
                division: '3A',
                grade: 12,
                wins: 0,
                losses: 0,
                finalElo: 1500,
                finalGlickoRating: 1500,
                finalGlickoRd: 200,
                finalGlickoVolatility: 0.06
            })
        ]);
        
        console.log(`✅ Created ${seasonRankings.length} sample season rankings`);
        
        // Create sample matches with rating evolution
        const matches = [
            {
                seasonRankingId: seasonRankings[0].id,
                athleteId: athletes[0].id,
                opponentId: athletes[1].id,
                matchResult: 'win',
                resultType: 'decision',
                weight: 145,
                matchDate: new Date('2024-01-15'),
                tournamentType: 'local'
            },
            {
                seasonRankingId: seasonRankings[0].id,
                athleteId: athletes[0].id,
                opponentId: athletes[2].id,
                matchResult: 'loss',
                resultType: 'major-decision',
                weight: 145,
                matchDate: new Date('2024-01-22'),
                tournamentType: 'district'
            },
            {
                seasonRankingId: seasonRankings[0].id,
                athleteId: athletes[0].id,
                opponentId: athletes[3].id,
                matchResult: 'win',
                resultType: 'technical-fall',
                weight: 145,
                matchDate: new Date('2024-01-29'),
                tournamentType: 'regional'
            },
            {
                seasonRankingId: seasonRankings[0].id,
                athleteId: athletes[0].id,
                opponentId: athletes[4].id,
                matchResult: 'win',
                resultType: 'fall',
                weight: 145,
                matchDate: new Date('2024-02-05'),
                tournamentType: 'state'
            }
        ];
        
        // Process matches and create ranking matches with rating calculations
        let currentElo = 1500;
        let currentGlicko = { rating: 1500, rd: 200, volatility: 0.06 };
        let wins = 0;
        let losses = 0;
        
        const rankingMatches = [];
        
        for (const matchData of matches) {
            // Calculate ELO
            const eloResult = performEloCalculation({
                winnerElo: matchData.matchResult === 'win' ? currentElo : 1500,
                loserElo: matchData.matchResult === 'win' ? 1500 : currentElo,
                result: matchData.resultType
            });
            
            // Calculate Glicko
            const glickoResult = performGlickoCalculation(
                {
                    rating: currentGlicko.rating,
                    rd: currentGlicko.rd,
                    volatility: currentGlicko.volatility,
                    id: matchData.athleteId,
                    name: `${athletes[0].firstName} ${athletes[0].lastName}`
                },
                {
                    rating: 1500,
                    rd: 200,
                    volatility: 0.06,
                    id: matchData.opponentId,
                    name: `${athletes.find(a => a.id === matchData.opponentId).firstName} ${athletes.find(a => a.id === matchData.opponentId).lastName}`
                },
                matchData.resultType
            );
            
            // Update current ratings
            if (matchData.matchResult === 'win') {
                currentElo = eloResult.winnerElo;
                currentGlicko = {
                    rating: glickoResult.winner.newRating,
                    rd: glickoResult.winner.newRd,
                    volatility: glickoResult.winner.newVolatility
                };
                wins++;
            } else {
                currentElo = eloResult.loserElo;
                currentGlicko = {
                    rating: glickoResult.loser.newRating,
                    rd: glickoResult.loser.newRd,
                    volatility: glickoResult.loser.newVolatility
                };
                losses++;
            }
            
            // Create ranking match record
            const rankingMatch = await RankingMatch.create({
                ...matchData,
                matchHash: `sample_${matchData.athleteId}_${matchData.opponentId}_${matchData.matchDate.getTime()}`,
                eloBefore: Math.round(matchData.matchResult === 'win' ? currentElo - eloResult.winnerElo + 1500 : currentElo - eloResult.loserElo + 1500),
                eloAfter: Math.round(currentElo),
                eloChange: Math.round(matchData.matchResult === 'win' ? eloResult.winnerElo - 1500 : eloResult.loserElo - 1500),
                glickoRatingBefore: matchData.matchResult === 'win' ? glickoResult.winner.oldRating : glickoResult.loser.oldRating,
                glickoRatingAfter: currentGlicko.rating,
                glickoRatingChange: matchData.matchResult === 'win' ? glickoResult.winner.ratingChange : glickoResult.loser.ratingChange,
                glickoRdBefore: matchData.matchResult === 'win' ? glickoResult.winner.oldRd : glickoResult.loser.oldRd,
                glickoRdAfter: currentGlicko.rd,
                glickoRdChange: matchData.matchResult === 'win' ? glickoResult.winner.rdChange : glickoResult.loser.rdChange,
                glickoVolatilityBefore: matchData.matchResult === 'win' ? glickoResult.winner.oldVolatility : glickoResult.loser.oldVolatility,
                glickoVolatilityAfter: currentGlicko.volatility,
                glickoVolatilityChange: matchData.matchResult === 'win' ? glickoResult.winner.newVolatility - glickoResult.winner.oldVolatility : glickoResult.loser.newVolatility - glickoResult.loser.oldVolatility,
                winsBefore: wins - (matchData.matchResult === 'win' ? 1 : 0),
                lossesBefore: losses - (matchData.matchResult === 'loss' ? 1 : 0),
                winsAfter: wins,
                lossesAfter: losses,
                opponentEloAtTime: 1500,
                opponentGlickoAtTime: 1500,
                opponentGlickoRdAtTime: 200,
                athleteEloAtTime: Math.round(matchData.matchResult === 'win' ? currentElo - eloResult.winnerElo + 1500 : currentElo - eloResult.loserElo + 1500),
                athleteGlickoAtTime: matchData.matchResult === 'win' ? glickoResult.winner.oldRating : glickoResult.loser.oldRating,
                athleteGlickoRdAtTime: matchData.matchResult === 'win' ? glickoResult.winner.oldRd : glickoResult.loser.oldRd
            });
            
            rankingMatches.push(rankingMatch);
        }
        
        // Update season ranking with final stats
        await seasonRankings[0].update({
            wins: wins,
            losses: losses,
            finalElo: Math.round(currentElo),
            finalGlickoRating: currentGlicko.rating,
            finalGlickoRd: currentGlicko.rd,
            finalGlickoVolatility: currentGlicko.volatility,
            totalMatches: rankingMatches.length,
            firstMatchDate: rankingMatches[0].matchDate,
            lastMatchDate: rankingMatches[rankingMatches.length - 1].matchDate
        });
        
        console.log(`✅ Created ${rankingMatches.length} sample ranking matches`);
        console.log(`✅ Updated season ranking for ${athletes[0].firstName} ${athletes[0].lastName}`);
        console.log(`   Final ELO: ${currentElo}`);
        console.log(`   Final Glicko: ${currentGlicko.rating.toFixed(2)}`);
        console.log(`   Record: ${wins}-${losses}`);
        
        console.log('\n🎉 Sample data created successfully!');
        console.log('You can now test the audit trail feature with athlete John Smith (ID: ' + athletes[0].id + ')');
        
    } catch (error) {
        console.error('❌ Error creating sample data:', error);
    }
}

// Run the script
createSampleData().then(() => {
    console.log('✅ Sample data creation completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});

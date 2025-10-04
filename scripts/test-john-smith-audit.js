// Test the audit trail API with John Smith (ID: 11175)

async function testJohnSmithAudit() {
    console.log('🧪 Testing John Smith Audit Trail...');
    
    try {
        const athleteId = 11175; // John Smith's ID from the sample data
        
        console.log(`👤 Testing with athlete ID: ${athleteId}`);
        
        // Test the ranking matches endpoint
        console.log('📊 Testing ranking matches endpoint...');
        const rankingMatchesResponse = await fetch(`http://localhost:3000/api/athletes/${athleteId}/ranking-matches`);
        const rankingMatchesResult = await rankingMatchesResponse.json();
        
        if (rankingMatchesResult.success) {
            console.log(`✅ Successfully fetched ${rankingMatchesResult.count} ranking matches`);
            
            if (rankingMatchesResult.data.length > 0) {
                console.log('📋 Sample match data:');
                rankingMatchesResult.data.forEach((match, index) => {
                    console.log(`  Match ${index + 1}:`);
                    console.log(`    - Date: ${match.matchDate}`);
                    console.log(`    - Opponent: ${match.opponent.name}`);
                    console.log(`    - Result: ${match.matchResult} (${match.resultType})`);
                    console.log(`    - ELO Change: ${match.elo.change}`);
                    console.log(`    - Glicko Change: ${match.glicko.rating.change}`);
                    console.log('');
                });
            } else {
                console.log('ℹ️  No ranking matches found for this athlete');
            }
        } else {
            console.log('❌ Failed to fetch ranking matches:', rankingMatchesResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testJohnSmithAudit();


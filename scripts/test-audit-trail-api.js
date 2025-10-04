// Using built-in fetch (Node.js 18+)

async function testAuditTrailAPI() {
    console.log('🧪 Testing Athlete Audit Trail API...');
    
    try {
        // First, get some athletes to test with
        console.log('📋 Fetching athletes...');
        const athletesResponse = await fetch('http://localhost:3000/api/athletes/search');
        const athletesResult = await athletesResponse.json();
        
        if (!athletesResult.success || athletesResult.data.length === 0) {
            console.log('❌ No athletes found to test with');
            return;
        }
        
        const testAthlete = athletesResult.data[0];
        console.log(`👤 Testing with athlete: ${testAthlete.firstName} ${testAthlete.lastName} (ID: ${testAthlete.id})`);
        
        // Test the ranking matches endpoint
        console.log('📊 Testing ranking matches endpoint...');
        const rankingMatchesResponse = await fetch(`http://localhost:3000/api/athletes/${testAthlete.id}/ranking-matches`);
        const rankingMatchesResult = await rankingMatchesResponse.json();
        
        if (rankingMatchesResult.success) {
            console.log(`✅ Successfully fetched ${rankingMatchesResult.count} ranking matches`);
            
            if (rankingMatchesResult.data.length > 0) {
                const sampleMatch = rankingMatchesResult.data[0];
                console.log('📋 Sample match data:');
                console.log(`  - Date: ${sampleMatch.matchDate}`);
                console.log(`  - Opponent: ${sampleMatch.opponent.name}`);
                console.log(`  - Result: ${sampleMatch.matchResult} (${sampleMatch.resultType})`);
                console.log(`  - ELO Change: ${sampleMatch.elo.change}`);
                console.log(`  - Glicko Change: ${sampleMatch.glicko.rating.change}`);
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
testAuditTrailAPI();

const TrackWrestlingMatchParser = require('../services/parsers/trackwrestlingMatchParser');

async function testParser() {
    console.log('🔍 Testing TrackWrestling Match Parser...');
    
    const testMatches = [
        'Trey Larsen (Morgan) over Zachary De La Rosa Valdez (Wasatch) (Fall 0:58)',
        'Jaxon Hardinger (Wasatch) over Daniel Watt (Morgan) (MD 9-0)',
        'Desmond Cadena (Morgan) over Finn Malan (Wasatch) (TF 20-5 5:44)',
        'Dylan Petersen (Morgan) over Nolan Wickes (Wasatch) (Dec 10-9)',
        'Skyler Crowther (Morgan) over Juan Marin (Wasatch) (Fall 1:05)'
    ];
    
    testMatches.forEach((matchText, index) => {
        console.log(`\n🧪 Test ${index + 1}: ${matchText}`);
        
        const parsed = TrackWrestlingMatchParser.parseMatch(matchText, '120');
        
        if (parsed) {
            console.log('✅ Parsed successfully:');
            console.log(`   Winner: ${parsed.winner.fullName} (${parsed.winner.school})`);
            console.log(`   Loser: ${parsed.loser.fullName} (${parsed.loser.school})`);
            console.log(`   Result: ${parsed.result.type} - ${parsed.result.raw}`);
            console.log(`   Weight: ${parsed.weightClass}`);
        } else {
            console.log('❌ Failed to parse');
        }
    });
    
    console.log('\n🎯 Testing parseMatches method...');
    
    const matchTexts = testMatches.map(matchText => ({
        matchText: matchText,
        weightClass: '120'
    }));
    
    const parsedMatches = TrackWrestlingMatchParser.parseMatches(matchTexts);
    
    console.log(`✅ Parsed ${parsedMatches.length}/${testMatches.length} matches`);
    
    parsedMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.winner.fullName} over ${match.loser.fullName} (${match.result.type})`);
    });
}

testParser();



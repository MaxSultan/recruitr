const trackwrestlingMatchParser = require('../services/parsers/trackwrestlingMatchParser');

// Test with the exact format that the browser service returns
const sampleMatchData = [
  {
    weightClass: '165',
    matchText: 'Landon MacKiernan (Pinkerton Academy) over Shayne Mackey (Alvirne) (M. For.)'
  },
  {
    weightClass: '145', 
    matchText: 'John Smith (Utah High) over Mike Johnson (Utah High) (Fall 1:30)'
  },
  {
    weightClass: '160',
    matchText: 'Chris Wilson (Utah High) over Alex Brown (Utah High) (Decision 8-6)'
  }
];

console.log('🔍 Debugging match parser with actual browser data format...');
console.log('📊 Sample match data:', JSON.stringify(sampleMatchData, null, 2));

try {
  const parsedMatches = trackwrestlingMatchParser.parseMatches(sampleMatchData);
  console.log('✅ Parsed matches successfully:', parsedMatches.length, 'matches');
  
  parsedMatches.forEach((match, index) => {
    console.log(`\n📋 Match ${index + 1}:`);
    console.log(`   Winner: ${match.winner.firstName} ${match.winner.lastName} (${match.winner.school})`);
    console.log(`   Loser: ${match.loser.firstName} ${match.loser.lastName} (${match.loser.school})`);
    console.log(`   Result: ${match.result.type} ${match.result.details || ''}`);
    console.log(`   Weight: ${match.weightClass}`);
  });
  
} catch (error) {
  console.error('❌ Error parsing matches:', error);
  console.error('Stack trace:', error.stack);
}

// Test individual match parsing
console.log('\n🔍 Testing individual match parsing...');
const individualMatch = {
  weightClass: '165',
  matchText: 'Landon MacKiernan (Pinkerton Academy) over Shayne Mackey (Alvirne) (M. For.)'
};

try {
  const parsedMatch = trackwrestlingMatchParser.parseMatch(individualMatch.matchText, individualMatch.weightClass);
  console.log('✅ Parsed individual match:', parsedMatch);
} catch (error) {
  console.error('❌ Error parsing individual match:', error);
  console.error('Stack trace:', error.stack);
}


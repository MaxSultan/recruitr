const trackwrestlingMatchParser = require('../services/parsers/trackwrestlingMatchParser');

// Sample match data that the scraper is finding but failing to process
const sampleMatchData = {
  text: '165 - Landon MacKiernan (Pinkerton Academy) over Shayne Mackey (Alvirne) (M. For.)',
  weight: '165',
  winner: 'Landon MacKiernan',
  winnerSchool: 'Pinkerton Academy',
  loser: 'Shayne Mackey',
  loserSchool: 'Alvirne',
  result: 'M. For.'
};

console.log('🔍 Debugging match processing...');
console.log('📊 Sample match data:', sampleMatchData);

try {
  const parsedMatch = trackwrestlingMatchParser.parseMatch(sampleMatchData);
  console.log('✅ Parsed match successfully:', parsedMatch);
} catch (error) {
  console.error('❌ Error parsing match:', error);
  console.error('Stack trace:', error.stack);
}

// Test with a simpler match
const simpleMatchData = {
  text: '145 - John Smith (Utah High) over Mike Johnson (Utah High) (Fall 1:30)',
  weight: '145',
  winner: 'John Smith',
  winnerSchool: 'Utah High',
  loser: 'Mike Johnson',
  loserSchool: 'Utah High',
  result: 'Fall 1:30'
};

console.log('\n🔍 Testing with simpler match...');
console.log('📊 Simple match data:', simpleMatchData);

try {
  const parsedSimpleMatch = trackwrestlingMatchParser.parseMatch(simpleMatchData);
  console.log('✅ Parsed simple match successfully:', parsedSimpleMatch);
} catch (error) {
  console.error('❌ Error parsing simple match:', error);
  console.error('Stack trace:', error.stack);
}


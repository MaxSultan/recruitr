#!/usr/bin/env node

const { syncDatabase } = require('../models');

async function setupDatabase() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  
  try {
    console.log('🔄 Setting up database...');
    
    if (force) {
      console.log('⚠️  WARNING: Using --force flag will DROP and recreate all tables!');
      console.log('⚠️  All existing data will be LOST!');
      
      // Give user 3 seconds to cancel
      console.log('⏰ Starting in 3 seconds... Press Ctrl+C to cancel');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await syncDatabase(force);
    
    console.log('✅ Database setup complete!');
    
    if (!force) {
      console.log('\n💡 To recreate tables (WARNING: clears all data), run:');
      console.log('   node scripts/setup-db.js --force');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();

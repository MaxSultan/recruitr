#!/usr/bin/env node

const { syncDatabase } = require('../models');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    const { stdout, stderr } = await execAsync('npm run migrate');
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr && !stderr.includes('Using environment')) {
      console.log('Migration stderr:', stderr);
    }
    
    console.log('✅ Migrations completed successfully!');
    return true;
  } catch (error) {
    if (error.message.includes('No migrations were executed') || 
        error.message.includes('No migrations need to be executed')) {
      console.log('ℹ️  No new migrations to run.');
      return true;
    }
    
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function setupDatabase() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const useMigrations = args.includes('--migrate') || args.includes('-m');
  
  try {
    console.log('🔄 Setting up database...');
    
    if (force) {
      console.log('⚠️  WARNING: Using --force flag will DROP and recreate all tables!');
      console.log('⚠️  All existing data will be LOST!');
      
      // Give user 3 seconds to cancel
      console.log('⏰ Starting in 3 seconds... Press Ctrl+C to cancel');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (useMigrations && !force) {
      // Use migrations for schema changes (preserves data)
      const success = await runMigrations();
      if (!success) {
        console.log('⚠️  Migrations failed, falling back to sync...');
        await syncDatabase(false);
      }
    } else {
      // Use sync for initial setup or force recreate
      await syncDatabase(force);
    }
    
    console.log('✅ Database setup complete!');
    
    if (!force && !useMigrations) {
      console.log('\n💡 Options:');
      console.log('   --migrate   Run migrations (preserves data)');
      console.log('   --force     Recreate tables (WARNING: clears all data)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();

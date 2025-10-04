const ScrapingStateService = require('../services/scrapers/scrapingStateService');
const { RankingMatch, Athlete } = require('../models');
const { spawn } = require('child_process');
const path = require('path');

class AdminController {
  constructor() {
    this.scrapingProcess = null;
    this.monitoringProcess = null;
    
    // Available options for scraping
    this.seasons = [
      '2024-25',
      '2023-24', 
      '2022-23'
    ];
    
    this.states = [
      'Utah',
      'Colorado', 
      'Arizona',
      'Nevada',
      'Idaho'
    ];
    
    this.levels = [
      'High School',
      'College'
    ];
    
    this.sexes = [
      'Boys',
      'Girls'
    ];
  }
  async getAdminDashboard(req, res) {
    try {
      console.log('🎯 Loading admin dashboard...');
      
      // Get default or current scraping parameters
      const defaultSeason = req.query.season || '2024-25';
      const defaultState = req.query.state || 'Utah';
      const defaultLevel = req.query.level || 'High School';
      const defaultSex = req.query.sex || 'Boys';
      
      // Create state service with current parameters
      const stateKey = `${defaultSeason} ${defaultLevel} ${defaultSex}`;
      let state = null;
      try {
        const stateService = new ScrapingStateService(stateKey, '50');
        state = stateService.loadState();
        console.log('✅ State loaded successfully');
      } catch (stateError) {
        console.warn('⚠️  Could not load state:', stateError.message);
        state = { events: [], currentEventIndex: 0 };
      }
      
      // Get current database stats
      const totalMatches = await RankingMatch.count();
      const totalAthletes = await Athlete.count();
      
      // Get recent matches
      const recentMatches = await RankingMatch.findAll({
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{
          model: Athlete,
          as: 'athlete',
          attributes: ['firstName', 'lastName']
        }]
      });

      res.render('admin', {
        title: 'Admin Dashboard',
        state: state,
        totalMatches,
        totalAthletes,
        recentMatches,
        isScrapingRunning: !!this.scrapingProcess && !this.scrapingProcess.killed,
        isMonitoringRunning: !!this.monitoringProcess && !this.monitoringProcess.killed,
        // Pass options to template
        seasons: this.seasons,
        states: this.states,
        levels: this.levels,
        sexes: this.sexes,
        // Current selections
        selectedSeason: defaultSeason,
        selectedState: defaultState,
        selectedLevel: defaultLevel,
        selectedSex: defaultSex
      });
      
      console.log('✅ Admin dashboard rendered successfully');
    } catch (error) {
      console.error('❌ Error loading admin dashboard:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).render('error', {
        error: 'Failed to load admin dashboard'
      });
    }
  }

  async getScrapingStatus(req, res) {
    try {
      const stateService = new ScrapingStateService('2024-25 High School Boys', '50');
      const state = stateService.loadState();
      
      const totalMatches = await RankingMatch.count();
      const totalAthletes = await Athlete.count();
      
      res.json({
        success: true,
        data: {
          state,
          totalMatches,
          totalAthletes,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting scraping status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async startScraping(req, res) {
    try {
      // Check if scraping is already running
      if (this.scrapingProcess && !this.scrapingProcess.killed) {
        return res.json({
          success: false,
          error: 'Scraping process is already running'
        });
      }

      // Get scraping parameters from request body
      const { season, state, level, sex } = req.body;
      
      // Validate parameters
      if (!season || !state || !level || !sex) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: season, state, level, sex'
        });
      }

      // Create a dynamic scraping script with parameters
      const scriptContent = `
const TrackWrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function scrapeWithParameters() {
  try {
    console.log('🚀 Starting scraping with parameters:');
    console.log('📅 Season:', '${season}');
    console.log('🗺️  State:', '${state}');
    console.log('🎓 Level:', '${level}');
    console.log('⚧ Sex:', '${sex}');
    
    const scraper = new TrackWrestlingScraperService({
      season: '${season}',
      state: '${state}',
      level: '${level}',
      sex: '${sex}',
      maxEvents: null,
      maxTeams: null,
      trackProgress: true
    });
    
    await scraper.scrapeMatches();
    console.log('✅ Scraping completed successfully!');
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

scrapeWithParameters();
      `;

      // Write temporary script
      const fs = require('fs');
      const tempScriptPath = path.join(__dirname, '../scripts/temp-scraping-script.js');
      fs.writeFileSync(tempScriptPath, scriptContent);

      // Start the scraping process with the dynamic script
      this.scrapingProcess = spawn('node', [tempScriptPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      // Start monitoring process
      const monitoringPath = path.join(__dirname, '../scripts/monitor-scraping.js');
      this.monitoringProcess = spawn('node', [monitoringPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      // Handle process events
      this.scrapingProcess.on('error', (error) => {
        console.error('Scraping process error:', error);
      });

      this.scrapingProcess.on('exit', (code, signal) => {
        console.log(`Scraping process exited with code ${code} and signal ${signal}`);
        this.scrapingProcess = null;
      });

      this.monitoringProcess.on('error', (error) => {
        console.error('Monitoring process error:', error);
      });

      this.monitoringProcess.on('exit', (code, signal) => {
        console.log(`Monitoring process exited with code ${code} and signal ${signal}`);
        this.monitoringProcess = null;
      });

      res.json({
        success: true,
        message: 'Scraping process started successfully',
        timestamp: new Date().toISOString(),
        processId: this.scrapingProcess.pid
      });
    } catch (error) {
      console.error('Error starting scraping:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async stopScraping(req, res) {
    try {
      let stoppedProcesses = 0;

      // Stop scraping process
      if (this.scrapingProcess && !this.scrapingProcess.killed) {
        this.scrapingProcess.kill('SIGTERM');
        stoppedProcesses++;
      }

      // Stop monitoring process
      if (this.monitoringProcess && !this.monitoringProcess.killed) {
        this.monitoringProcess.kill('SIGTERM');
        stoppedProcesses++;
      }

      // Also try to kill any existing processes
      const { exec } = require('child_process');
      exec('pkill -f "node scripts/process-all-250-utah-events.js"', (error) => {
        if (!error) console.log('Killed existing scraping processes');
      });
      
      exec('pkill -f "node scripts/monitor-scraping.js"', (error) => {
        if (!error) console.log('Killed existing monitoring processes');
      });

      res.json({
        success: true,
        message: `Scraping process stopped (${stoppedProcesses} processes terminated)`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error stopping scraping:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();

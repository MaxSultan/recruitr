const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const AuthFetcherHTTP = require('./auth-fetcher-http');
const TournamentParticipantsScraper = require('./tournament-scraper');
const { syncDatabase } = require('./models');
const athleteService = require('./services/athleteService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get authentication session for a tournament
app.get('/auth/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    if (!tournamentId) {
      return res.status(400).json({ 
        error: 'Tournament ID is required' 
      });
    }

    console.log(`Fetching auth for tournament: ${tournamentId}`);
    const authFetcher = new AuthFetcherHTTP(tournamentId);
    const authData = await authFetcher.call();
    
    res.json({
      success: true,
      data: authData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      error: 'Failed to fetch authentication',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Scrape tournament participants data (without saving to database)
app.get('/tournament/:tournamentId/participants', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { year } = req.query;
    
    if (!tournamentId) {
      return res.status(400).json({ 
        error: 'Tournament ID is required' 
      });
    }

    const tournamentYear = year || new Date().getFullYear().toString();
    
    console.log(`Scraping tournament ${tournamentId} for year ${tournamentYear}`);
    const scraper = new TournamentParticipantsScraper(tournamentId, tournamentYear);
    const participants = await scraper.call();
    
    res.json({
      success: true,
      data: participants,
      count: participants.length,
      tournamentId: tournamentId,
      year: tournamentYear,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      error: 'Failed to scrape tournament data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Scrape tournament participants and save to database
app.post('/tournament/scrape', async (req, res) => {
  try {
    const { tournamentId, year, state } = req.body;
    
    if (!tournamentId) {
      return res.status(400).json({ 
        error: 'Tournament ID is required in request body' 
      });
    }

    const tournamentYear = year || new Date().getFullYear().toString();
    
    console.log(`🏁 Scraping tournament ${tournamentId} for year ${tournamentYear}${state ? ` (state: ${state})` : ''}`);
    const scraper = new TournamentParticipantsScraper(tournamentId, tournamentYear);
    const participants = await scraper.call();
    
    console.log(`📊 Scraped ${participants.length} participants, now saving to database...`);
    
                // Process and save results to database
            const databaseResults = await athleteService.processTournamentResults(participants, state, tournamentId);
    
    res.json({
      success: true,
      data: databaseResults.results,
      stats: databaseResults.stats,
      scraped: {
        count: participants.length,
        tournamentId: tournamentId,
        year: tournamentYear,
        state: state || null,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Scraping/Database error:', error);
    res.status(500).json({
      error: 'Failed to scrape tournament data or save to database',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search athletes by name
app.get('/athletes/search', async (req, res) => {
  try {
    const { q: query, limit } = req.query;
    
    // Allow empty query to return all athletes
    const searchQuery = query || '';
    
    const athletes = await athleteService.searchAthletes(searchQuery, parseInt(limit) || 50);
    
    res.json({
      success: true,
      data: athletes,
      count: athletes.length,
      query: query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Athlete search error:', error);
    res.status(500).json({
      error: 'Failed to search athletes',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get athlete by ID with all seasons
app.get('/athletes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const athlete = await athleteService.getAthleteWithSeasons(parseInt(id));
    
    if (!athlete) {
      return res.status(404).json({
        error: 'Athlete not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: athlete,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Athlete fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch athlete',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Toggle athlete favorite status
app.patch('/athletes/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    
    const athlete = await athleteService.toggleFavorite(parseInt(id));
    
    if (!athlete) {
      return res.status(404).json({
        error: 'Athlete not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        isFavorite: athlete.isFavorite
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Toggle favorite error:', error);
    res.status(500).json({
      error: 'Failed to toggle favorite status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Merge two athletes
app.post('/athletes/merge', async (req, res) => {
  try {
    const { keepAthleteId, mergeAthleteId } = req.body;
    
    if (!keepAthleteId || !mergeAthleteId) {
      return res.status(400).json({
        error: 'Both keepAthleteId and mergeAthleteId are required',
        timestamp: new Date().toISOString()
      });
    }
    
    if (keepAthleteId === mergeAthleteId) {
      return res.status(400).json({
        error: 'Cannot merge athlete with themselves',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await athleteService.mergeAthletes(parseInt(keepAthleteId), parseInt(mergeAthleteId));
    
    if (!result) {
      return res.status(404).json({
        error: 'One or both athletes not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: result,
      message: `Successfully merged athletes. ${result.mergedSeasons} seasons moved.`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Merge athletes error:', error);
    res.status(500).json({
      error: 'Failed to merge athletes',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get teams for a tournament
app.get('/tournament/:tournamentId/teams', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    if (!tournamentId) {
      return res.status(400).json({ 
        error: 'Tournament ID is required' 
      });
    }

    console.log(`Fetching teams for tournament: ${tournamentId}`);
    const scraper = new TournamentParticipantsScraper(tournamentId, new Date().getFullYear().toString());
    await scraper.initialize();
    const teams = await scraper.getTeams();
    
    res.json({
      success: true,
      data: teams,
      count: teams.length,
      tournamentId: tournamentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Teams fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch teams',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /auth/:tournamentId',
      'GET /tournament/:tournamentId/participants?year=YYYY',
      'GET /tournament/:tournamentId/teams',
      'POST /tournament/scrape',
      'GET /athletes/search?q=name',
      'GET /athletes/:id'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await syncDatabase(false); // Set to true to recreate tables (WARNING: clears data)
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Recruitr server running on port ${PORT}`);
      console.log(`🌐 Web UI available at: http://localhost:${PORT}`);
      console.log(`📋 API endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /auth/:tournamentId`);
      console.log(`   GET  /tournament/:tournamentId/participants?year=YYYY`);
      console.log(`   GET  /tournament/:tournamentId/teams`);
      console.log(`   POST /tournament/scrape`);
      console.log(`   GET  /athletes/search?q=name`);
      console.log(`   GET  /athletes/:id`);
      console.log(`   PATCH /athletes/:id/favorite`);
      console.log(`   POST /athletes/merge`);
      console.log(`\n🔗 Quick start:`);
      console.log(`   1. Open http://localhost:${PORT} in your browser`);
      console.log(`   2. Or curl http://localhost:${PORT}/health`);
      console.log(`   3. Or curl "http://localhost:${PORT}/athletes/search?q=Smith"`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

const express = require('express');
const cors = require('cors');
const AuthFetcherHTTP = require('./auth-fetcher-http');
const TournamentParticipantsScraper = require('./tournament-scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

// Scrape tournament participants data
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

// Scrape tournament participants with POST (for additional parameters)
app.post('/tournament/scrape', async (req, res) => {
  try {
    const { tournamentId, year } = req.body;
    
    if (!tournamentId) {
      return res.status(400).json({ 
        error: 'Tournament ID is required in request body' 
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
      'POST /tournament/scrape'
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Recruitr server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /auth/:tournamentId`);
  console.log(`   GET  /tournament/:tournamentId/participants?year=YYYY`);
  console.log(`   GET  /tournament/:tournamentId/teams`);
  console.log(`   POST /tournament/scrape`);
  console.log(`\n🔗 Example usage:`);
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl http://localhost:${PORT}/tournament/12345/participants?year=2024`);
});

module.exports = app;

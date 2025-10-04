const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

// Import database sync
const { syncDatabase } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Serve static files
app.use(express.static('public'));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api', routes);

// Serve the main UI
app.get('/', (req, res) => {
  res.render('index');
});

// Athlete audit trail page
app.get('/athletes/:id/ranking_audit', require('./controllers/athleteController').getAthleteRankingAuditPage);

// Admin routes
const adminController = require('./controllers/adminController');
app.get('/admin', adminController.getAdminDashboard.bind(adminController));
app.get('/admin/test', (req, res) => {
  res.json({ message: 'Admin test route working' });
});
app.get('/admin/status', adminController.getScrapingStatus.bind(adminController));
app.post('/admin/start-scraping', adminController.startScraping.bind(adminController));
app.post('/admin/stop-scraping', adminController.stopScraping.bind(adminController));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Syncing database...');
    await syncDatabase();
    console.log('✅ Database synced successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Application available at: http://localhost:${PORT}`);
      console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
      console.log(`\n📋 Available API endpoints:`);
      console.log(`   GET  /api/health`);
      console.log(`   GET  /api/athletes/search?q=name`);
      console.log(`   GET  /api/athletes/:id`);
      console.log(`   PATCH /api/athletes/:id/favorite`);
      console.log(`   POST /api/athletes/merge`);
      console.log(`   GET  /api/seasons/:seasonId`);
      console.log(`   PUT  /api/seasons/:seasonId`);
      console.log(`   DELETE /api/seasons/:seasonId`);
      console.log(`   POST /api/athletes/:athleteId/seasons`);
      console.log(`   GET  /api/tournament/:tournamentId/participants`);
      console.log(`   POST /api/tournament/scrape`);
      console.log(`   GET  /api/tournament/:tournamentId/teams`);
      console.log(`   GET  /api/auth/:tournamentId`);
      console.log(`\n🔗 Quick start:`);
      console.log(`   1. Open http://localhost:${PORT} in your browser`);
      console.log(`   2. Use the web interface to search and manage athletes`);
      console.log(`   3. Or use the API endpoints directly for programmatic access`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;

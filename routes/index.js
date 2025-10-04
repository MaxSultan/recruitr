const express = require('express');
const router = express.Router();

// Import route modules
const athleteRoutes = require('./athletes');
const seasonRoutes = require('./seasons');
const tournamentRoutes = require('./tournaments');
const authRoutes = require('./auth');
const seasonAnalyticsRoutes = require('./seasonAnalytics');
const trackwrestlingRoutes = require('./trackwrestling');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount route modules
router.use('/athletes', athleteRoutes);
router.use('/seasons', seasonRoutes);
router.use('/tournament', tournamentRoutes);
router.use('/auth', authRoutes);
router.use('/season-analytics', seasonAnalyticsRoutes);
router.use('/trackwrestling', trackwrestlingRoutes);

module.exports = router;

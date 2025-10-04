# TrackWrestling Automated Scraper

This document describes the comprehensive TrackWrestling scraper system that implements the ELO ranking system flowchart for automated wrestling data collection and rating calculations.

## 🎯 Overview

The scraper automatically:
1. Navigates to TrackWrestling.com > OPC (Online Public Console)
2. Selects appropriate season and state association
3. Processes events and determines tournament types
4. Scrapes match data with deduplication
5. Calculates both ELO and Glicko ratings
6. Updates athlete records in the database

## 🏗️ Architecture

### Core Components

#### 1. TrackWrestlingScraper (`services/trackwrestling-scraper.js`)
- Main scraper class that orchestrates the entire process
- Handles navigation, authentication, and data processing
- Implements the complete flowchart logic

#### 2. MatchParser (`services/match-parser.js`)
- Specialized parser for extracting match data from HTML
- Handles different tournament formats (individual, dual meets, team tournaments)
- Robust pattern matching for various data structures

#### 3. Rating Calculations
- **ELO**: `utilities/perform-elo-calculation.js`
- **Glicko**: `utilities/perform-glicko-calculation.js`

#### 4. Database Models
- **Athlete**: Enhanced with rating fields (ELO, Glicko, win/loss records)
- **Match**: Stores individual match results and rating changes
- **Season**: Existing model for seasonal data

## 🚀 Usage

### Basic Usage

```bash
# Run scraper for default state (Utah)
npm run scrape:trackwrestling

# Run scraper for specific state
npm run scrape:trackwrestling:utah
npm run scrape:trackwrestling:colorado
npm run scrape:trackwrestling:arizona
npm run scrape:trackwrestling:idaho
npm run scrape:trackwrestling:nevada

# Run scraper with custom season
node scripts/run-trackwrestling-scraper.js --season 2024-2025
```

### Testing

```bash
# Test scraper components
npm run test:scraper

# Run all tests
npm test
```

## 📊 Database Schema

### Athletes Table (Enhanced)
```sql
-- New rating fields added
elo INTEGER DEFAULT 1500
glickoRating DECIMAL(10,2) DEFAULT 1500
glickoRd DECIMAL(10,2) DEFAULT 200
glickoVolatility DECIMAL(10,6) DEFAULT 0.06
wins INTEGER DEFAULT 0
losses INTEGER DEFAULT 0
lastMatchDate DATE
```

### Matches Table (New)
```sql
CREATE TABLE Matches (
  id SERIAL PRIMARY KEY,
  winnerId INTEGER REFERENCES athletes(id),
  loserId INTEGER REFERENCES athletes(id),
  result ENUM('decision', 'major-decision', 'technical-fall', 'fall'),
  weight INTEGER,
  date DATE NOT NULL,
  tournamentType ENUM('local', 'district', 'regional', 'state', 'national'),
  sourceUrl TEXT,
  matchHash VARCHAR(255) UNIQUE,
  -- Rating tracking fields
  winnerEloBefore INTEGER,
  winnerEloAfter INTEGER,
  loserEloBefore INTEGER,
  loserEloAfter INTEGER,
  winnerGlickoRatingBefore DECIMAL(10,2),
  winnerGlickoRatingAfter DECIMAL(10,2),
  -- ... more rating fields
  processedAt TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Match Deduplication

The system prevents processing the same match multiple times using:

1. **Match Hash**: Created from wrestler names, weight, and date
2. **Database Unique Constraint**: `matchHash` field prevents duplicates
3. **In-Memory Set**: Tracks processed matches during current run

```javascript
const matchHash = JSON.stringify({
  winner: matchData.winner.toLowerCase().trim(),
  loser: matchData.loser.toLowerCase().trim(),
  weight: matchData.weight,
  date: matchData.date
});
```

## 🏆 Rating Systems

### ELO Rating System
- **Starting Rating**: 1500
- **K-Factor**: 16 (base), adjusted by win type:
  - Decision: 1.0x (16)
  - Major Decision: 1.2x (19.2)
  - Technical Fall: 1.4x (22.4)
  - Fall: 1.6x (25.6)

### Glicko Rating System
- **Starting Rating**: 1500
- **Starting RD**: 200
- **Starting Volatility**: 0.06
- **Conservative Scaling**: 0.25x for realistic rating changes

## 📅 Scheduling

### Cron Jobs
The system includes cron job configurations in `cron-jobs.txt`:

```bash
# Daily at 6 AM for all states
0 6 * * * cd /path/to/project && node scripts/run-trackwrestling-scraper.js >> logs/scraper.log 2>&1

# Twice daily for Utah (more active)
0 6 * * * cd /path/to/project && node scripts/run-trackwrestling-scraper.js --state utah >> logs/utah-scraper.log 2>&1
0 18 * * * cd /path/to/project && node scripts/run-trackwrestling-scraper.js --state utah >> logs/utah-scraper.log 2>&1
```

### Setup Cron Jobs
```bash
# Create logs directory
mkdir -p logs

# Add cron jobs
crontab cron-jobs.txt

# Check cron jobs
crontab -l
```

## 🔧 Configuration

### State Associations
The scraper supports these state associations:
- Utah High School Activities Association (50)
- Colorado High School Activities Association (10)
- Arizona Interscholastic Association (7)
- Idaho High School Activities Association (16)
- Nevada Interscholastic Activities Association (34)

### Tournament Types
- **Local**: Regular season matches
- **District**: District championships
- **Regional**: Regional championships
- **State**: State championships
- **National**: National tournaments

## 🐛 Error Handling

The scraper includes comprehensive error handling:

1. **Graceful Failures**: Individual match errors don't stop the entire process
2. **Retry Logic**: Network failures are handled with appropriate delays
3. **Logging**: Detailed logs for debugging and monitoring
4. **Error Counting**: Tracks errors for reporting

## 📈 Monitoring

### Log Files
- `logs/scraper.log`: General scraper activity
- `logs/utah-scraper.log`: Utah-specific scraping
- `logs/[state]-scraper.log`: State-specific logs

### Metrics Tracked
- Matches processed
- Athletes updated
- Errors encountered
- Processing time

## 🚨 Important Notes

1. **Rate Limiting**: The scraper includes delays to avoid overwhelming TrackWrestling servers
2. **Authentication**: Uses existing AuthFetcherHTTP for proper authentication
3. **Data Integrity**: Match deduplication ensures data consistency
4. **Scalability**: Designed to handle large volumes of match data

## 🔄 Migration

To add the new database fields:

```bash
# Run the migration
npm run migrate

# Or force recreate tables (WARNING: deletes all data)
npm run setup-db:force
```

## 🧪 Testing

Run the test suite to verify all components:

```bash
# Test individual components
npm run test:scraper

# Test rating calculations
npm test utilities/perform-elo-calculation.test.js
npm test utilities/perform-glicko-calculation.test.js

# Full test suite
npm test
```

## 📝 Future Enhancements

1. **Real-time Processing**: WebSocket integration for live match updates
2. **Advanced Analytics**: Statistical analysis and trend detection
3. **API Integration**: REST API for external access to rating data
4. **Machine Learning**: Predictive modeling for match outcomes
5. **Multi-state Support**: Parallel processing for multiple states

## 🤝 Contributing

When modifying the scraper:

1. Test changes with `npm run test:scraper`
2. Verify rating calculations with existing test suite
3. Update documentation for any new features
4. Ensure backward compatibility with existing data

## 📞 Support

For issues or questions:
1. Check the logs in the `logs/` directory
2. Run the test suite to identify problems
3. Review the flowchart implementation in the code
4. Check database connectivity and migrations

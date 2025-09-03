# Recruitr - Track Wrestling Tournament Scraper

A Node.js Express server that scrapes tournament data from Track Wrestling, converted from Ruby to JavaScript.

## Features

- **Authentication**: Automatically handles Track Wrestling session authentication using Puppeteer
- **Tournament Data Scraping**: Extracts participant results, team information, and tournament details
- **RESTful API**: Clean HTTP endpoints for accessing wrestling tournament data
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Ready for frontend integration

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd recruitr
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install system dependencies** (for Puppeteer):
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install -y wget gnupg ca-certificates
   
   # On macOS (using Homebrew)
   brew install chromium
   ```

## Usage

### Starting the Server

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

### API Endpoints

#### 1. Health Check
```http
GET /health
```
Returns server status and timestamp.

#### 2. Get Authentication Session
```http
GET /auth/:tournamentId
```
Fetches authentication session for a specific tournament.

**Example:**
```bash
curl http://localhost:3000/auth/12345
```

#### 3. Get Tournament Participants
```http
GET /tournament/:tournamentId/participants?year=YYYY
```
Scrapes all participant data for a tournament.

**Parameters:**
- `tournamentId` (required): The Track Wrestling tournament ID
- `year` (optional): Tournament year (defaults to current year)

**Example:**
```bash
curl "http://localhost:3000/tournament/12345/participants?year=2024"
```

#### 4. Get Tournament Teams
```http
GET /tournament/:tournamentId/teams
```
Fetches all teams participating in a tournament.

**Example:**
```bash
curl http://localhost:3000/tournament/12345/teams
```

#### 5. Scrape Tournament (POST)
```http
POST /tournament/scrape
Content-Type: application/json

{
  "tournamentId": "12345",
  "year": "2024"
}
```
Alternative endpoint for scraping with request body parameters.

**Example:**
```bash
curl -X POST http://localhost:3000/tournament/scrape \
  -H "Content-Type: application/json" \
  -d '{"tournamentId": "12345", "year": "2024"}'
```

### Response Format

All endpoints return JSON responses in this format:

**Success Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 25,
  "tournamentId": "12345",
  "year": "2024",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Participant Data Structure

Each participant object contains:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "wins": 5,
  "losses": 2,
  "place": "1st",
  "pointsScored": 18.5,
  "team": "Eagles Wrestling",
  "year": "2024",
  "division": "1A",
  "weightClass": "125",
  "grade": ""
}
```

## Architecture

The application consists of three main modules:

### 1. AuthFetcher (`auth-fetcher.js`)
- Handles Track Wrestling authentication
- Uses Puppeteer to navigate and extract session cookies
- Converts Ruby Watir browser automation to Node.js Puppeteer

### 2. TournamentParticipantsScraper (`tournament-scraper.js`)
- Scrapes tournament data using authenticated sessions
- Extracts participant results, team information
- Converts Ruby HTTP/Nokogiri scraping to Node.js Axios/Cheerio

### 3. Express Server (`server.js`)
- Provides RESTful API endpoints
- Handles request validation and error responses
- Includes comprehensive logging and CORS support

## Environment Variables

You can customize the server using environment variables:

```bash
PORT=3000  # Server port (default: 3000)
```

## Error Handling

The application includes comprehensive error handling:

- **Network errors**: Timeout and connection issues
- **Authentication failures**: Invalid tournament IDs or session issues
- **Parsing errors**: Malformed HTML or unexpected data structures
- **Server errors**: Unhandled exceptions and validation errors

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic server restarts on file changes.

### Debugging

The application includes extensive console logging. To see detailed logs:

1. Check the server console output
2. Look for specific error messages in API responses
3. Use browser dev tools for client-side debugging

## Migration from Ruby

This Node.js version maintains the same functionality as the original Ruby code:

- **Ruby Watir** → **Node.js Puppeteer** (browser automation)
- **Ruby Net::HTTP** → **Node.js Axios** (HTTP requests)
- **Ruby Nokogiri** → **Node.js Cheerio** (HTML parsing)
- **Ruby modules/classes** → **Node.js ES6 classes with modules**

## Troubleshooting

### Common Issues

1. **Puppeteer fails to launch**:
   - Install Chrome/Chromium: `sudo apt-get install chromium-browser`
   - Or use bundled Chromium: The package.json includes Puppeteer which bundles Chromium

2. **Authentication timeouts**:
   - Increase timeout in `auth-fetcher.js`
   - Check if tournament ID is valid

3. **Empty results**:
   - Verify tournament has published results
   - Check if tournament structure has changed

4. **Memory issues**:
   - Puppeteer instances are properly closed after use
   - Consider implementing connection pooling for high traffic

## License

MIT License - see LICENSE file for details.

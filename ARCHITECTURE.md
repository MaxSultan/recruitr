# Recruitr Application Architecture

This document describes the traditional Express.js application structure implemented for the Recruitr wrestling tournament tracker.

## Directory Structure

```
recruitr/
├── app.js                 # Main application entry point
├── package.json          # Dependencies and scripts
├── config/               # Configuration files
│   ├── database.js       # Database configuration
│   └── sequelize.js      # Sequelize configuration
├── controllers/          # Business logic controllers
│   ├── athleteController.js
│   ├── seasonController.js
│   ├── tournamentController.js
│   └── authController.js
├── middleware/           # Custom middleware
│   ├── logger.js         # Request logging
│   ├── errorHandler.js   # Global error handling
│   └── validation.js     # Request validation
├── models/               # Database models
│   ├── Athlete.js
│   ├── Season.js
│   └── index.js
├── routes/               # API route definitions
│   ├── index.js          # Main router
│   ├── athletes.js       # Athlete routes
│   ├── seasons.js        # Season routes
│   ├── tournaments.js    # Tournament routes
│   └── auth.js           # Authentication routes
├── services/             # Business logic services
│   └── athleteService.js
├── views/                # EJS templates
│   ├── index.ejs         # Main application view
│   └── partials/         # Reusable template partials
│       └── modals.ejs    # Modal components
├── public/               # Static assets
│   ├── css/
│   ├── js/
│   └── index.html        # Legacy static file
├── migrations/           # Database migrations
├── scripts/              # Utility scripts
└── auth-fetcher-http.js  # Authentication service
tournament-scraper.js     # Tournament scraping service
```

## Architecture Components

### 1. Controllers (`/controllers`)

Controllers handle the business logic and coordinate between routes, services, and models.

**Responsibilities:**
- Process HTTP requests and responses
- Validate input data
- Call appropriate services
- Handle errors and return appropriate HTTP status codes
- Format response data

**Key Controllers:**
- `athleteController.js` - Handles athlete-related operations
- `seasonController.js` - Manages wrestling seasons
- `tournamentController.js` - Tournament scraping and data management
- `authController.js` - Authentication for Track Wrestling

### 2. Routes (`/routes`)

Routes define the API endpoints and map them to controller methods.

**Structure:**
- `index.js` - Main router that mounts all sub-routes
- `athletes.js` - `/api/athletes/*` endpoints
- `seasons.js` - `/api/seasons/*` endpoints
- `tournaments.js` - `/api/tournament/*` endpoints
- `auth.js` - `/api/auth/*` endpoints

**API Endpoints:**
```
GET    /api/health
GET    /api/athletes/search?q=name
GET    /api/athletes/:id
PATCH  /api/athletes/:id/favorite
POST   /api/athletes/merge
POST   /api/athletes/:athleteId/seasons
GET    /api/seasons/:seasonId
PUT    /api/seasons/:seasonId
DELETE /api/seasons/:seasonId
GET    /api/tournament/:tournamentId/participants
POST   /api/tournament/scrape
GET    /api/tournament/:tournamentId/teams
GET    /api/auth/:tournamentId
```

### 3. Middleware (`/middleware`)

Custom middleware functions that process requests before they reach controllers.

**Middleware Functions:**
- `logger.js` - Request logging with IP, User-Agent, and timestamp
- `errorHandler.js` - Global error handling with proper HTTP status codes
- `validation.js` - Request validation utilities

### 4. Views (`/views`)

EJS templates for server-side rendering.

**Templates:**
- `index.ejs` - Main application interface
- `partials/modals.ejs` - Reusable modal components

### 5. Services (`/services`)

Business logic services that interact with the database and external APIs.

**Services:**
- `athleteService.js` - Database operations for athletes and seasons

### 6. Models (`/models`)

Sequelize database models and associations.

**Models:**
- `Athlete.js` - Athlete entity with seasons relationship
- `Season.js` - Wrestling season data
- `index.js` - Model associations and database sync

## Request Flow

1. **HTTP Request** → Express app
2. **Middleware** → Logger, CORS, JSON parsing
3. **Route Matching** → Routes determine controller
4. **Controller** → Business logic and validation
5. **Service** → Database operations
6. **Model** → Database interaction
7. **Response** → JSON or rendered view

## Error Handling

The application uses a centralized error handling approach:

1. **Controller Level** - Try/catch blocks with specific error responses
2. **Middleware Level** - Global error handler for unhandled errors
3. **Service Level** - Database and external API error handling

## Database Integration

- **ORM**: Sequelize with PostgreSQL
- **Migrations**: Database schema versioning
- **Associations**: Athlete-Season relationships
- **Validation**: Model-level data validation

## Frontend Integration

- **Static Assets**: Served from `/public` directory
- **Templates**: EJS server-side rendering
- **API**: RESTful JSON endpoints
- **JavaScript**: Client-side application in `/public/js/app.js`

## Development Workflow

1. **Routes** - Define new endpoints in route files
2. **Controllers** - Implement business logic
3. **Services** - Add database operations
4. **Models** - Update database schema if needed
5. **Views** - Update templates for UI changes
6. **Middleware** - Add custom processing if required

## Benefits of This Structure

1. **Separation of Concerns** - Clear boundaries between layers
2. **Maintainability** - Easy to locate and modify code
3. **Testability** - Controllers and services can be unit tested
4. **Scalability** - Easy to add new features and endpoints
5. **Team Development** - Multiple developers can work on different layers
6. **Code Reusability** - Services and middleware can be reused

## Migration from Legacy Structure

The application has been migrated from a monolithic `server.js` file to this structured approach:

- **Before**: All routes and logic in `server.js`
- **After**: Organized into controllers, routes, middleware, and views
- **Benefits**: Better organization, maintainability, and scalability

## Next Steps

1. Add unit tests for controllers and services
2. Implement API documentation (Swagger/OpenAPI)
3. Add input validation middleware
4. Implement authentication and authorization
5. Add rate limiting and security middleware
6. Create database seeders for development data

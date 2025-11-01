# Better Jobs Backend

A NestJS backend application for scraping job listings from jobs.ge with PostgreSQL database integration.

## Features

- **Job Scraping**: Comprehensive scraping of job listings from jobs.ge
- **Database Integration**: PostgreSQL database with Prisma ORM
- **API Documentation**: Swagger/OpenAPI documentation at `/api`
- **Structured Logging**: Winston logger with file and console transports
- **Automated Cron Jobs**:
  - Daily job scraping at 4:00 AM GMT+4
  - Automatic cleanup of expired jobs at 00:00 GMT+4
- **Optimized Performance**: 5-second delays for respectful scraping
- **Deduplication**: Automatic duplicate job removal
- **Search Parameters**: Support for job types, locations, and categories

## Prerequisites

- Node.js (v20.14.0 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/better_jobs?schema=better_jobs"
   DIRECT_URL="postgresql://username:password@localhost:5432/better_jobs?schema=better_jobs"
   PORT=3001
   LOG_LEVEL=info
   NODE_ENV=development
   ```

3. **Set up PostgreSQL database**:
   - Install PostgreSQL
   - Create a database named `better_jobs`
   - Update the `DATABASE_URL` in your `.env` file

4. **Run database migrations**:

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

## Database Schema

The application uses the following database schema:

- **jobs**: Main table storing scraped job listings
- **types**: Job type search parameters
- **locations**: Location search parameters
- **categories**: Category search parameters

See `prisma/schema.prisma` for the complete schema definition.

## API Endpoints

### Documentation

- `GET /api` - Swagger/OpenAPI documentation interface

### Job Scraping

- `POST /jobs/scrape-all` - Manually trigger comprehensive job scraping and save to database
- `GET /jobs/scraped` - Get all scraped jobs from database
- `GET /jobs/database` - Get all scraped jobs from database (alias)
- `GET /jobs/database/count` - Get count of jobs in database

### Job Search

- `GET /jobs` - Search jobs with optional query parameters:
  - `page` - Page number to scrape
  - `q` - Search query string
  - `cid` - Category ID
  - `lid` - Location ID
  - `jid` - Job type ID
  - `maxPages` - Maximum pages to scrape (default: 3)
  - `startPage` - Starting page number (default: 1)
  - `delayMs` - Delay between requests in milliseconds (default: 2000)

### Search Parameters

- `GET /jobs/types` - Get all available job types
- `GET /jobs/locations` - Get all available locations
- `GET /jobs/categories` - Get all available categories
- `GET /jobs/search-params-status` - Get search parameters seeding status

## Usage

### Start the application:

```bash
npm run start:dev
```

The application will start on `http://localhost:3001` (or the port specified in `PORT` env variable).

### Access API Documentation:

Visit `http://localhost:3001/api` to view the interactive Swagger documentation.

### Manual Job Scraping:

```bash
curl -X POST http://localhost:3001/jobs/scrape-all
```

### Get jobs from database:

```bash
curl http://localhost:3001/jobs/database
```

### Get job count:

```bash
curl http://localhost:3001/jobs/database/count
```

### Get search parameters:

```bash
curl http://localhost:3001/jobs/types
curl http://localhost:3001/jobs/locations
curl http://localhost:3001/jobs/categories
```

## Scraping Configuration

- **Delay**: 5 seconds between requests (partially compliant with robots.txt)
- **Pages**: 1 page per combination for optimal performance
- **Combinations**: All valid type × location × category combinations
- **Automated Scraping**: Runs daily at 4:00 AM GMT+4 via cron job

## Automated Tasks

The application includes two scheduled cron jobs:

1. **Daily Job Scraping** (`0 4 * * *` GMT+4):
   - Automatically scrapes all jobs from jobs.ge
   - Saves to database with deduplication
   - Runs at 4:00 AM every day

2. **Expired Jobs Cleanup** (`0 0 * * *` GMT+4):
   - Automatically deletes jobs with passed deadlines
   - Runs at midnight (00:00) every day
   - Helps maintain database cleanliness

## Development

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Project Structure

```
src/
├── jobs/                 # Job scraping module
│   ├── interfaces/       # TypeScript interfaces
│   ├── dto/              # Data Transfer Objects for Swagger
│   ├── jobs.service.ts   # Business logic
│   ├── jobs.controller.ts # API endpoints
│   └── jobs-scraper.service.ts # Web scraping logic & cron jobs
├── database/             # Database operations
├── prisma/              # Prisma configuration
├── common/
│   └── logger/          # Winston logger configuration
└── app.module.ts        # Main application module
```

## Environment Variables

| Variable       | Description                   | Example                                                                |
| -------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string  | `postgresql://user:pass@localhost:5432/better_jobs?schema=better_jobs` |
| `DIRECT_URL`   | Direct PostgreSQL connection  | `postgresql://user:pass@localhost:5432/better_jobs?schema=better_jobs` |
| `PORT`         | Server port (default: 3001)   | `3001`                                                                 |
| `LOG_LEVEL`    | Logging level (default: info) | `info`, `debug`, `warn`, `error`                                       |
| `NODE_ENV`     | Environment                   | `development`, `production`                                            |

## Logging

The application uses Winston for structured logging:

- **Console Output**: Pretty-printed in development, JSON in production
- **File Logs**: Stored in `logs/` directory:
  - `combined.log` - All logs
  - `error.log` - Error logs only
  - `exceptions.log` - Uncaught exceptions
  - `rejections.log` - Unhandled promise rejections

Log files are automatically rotated (5MB max, 5 files retained).

## License

MIT

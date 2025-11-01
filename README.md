# Better Jobs Backend

A NestJS backend application for scraping job listings from jobs.ge with PostgreSQL database integration.

## Features

- **Job Scraping**: Comprehensive scraping of job listings from jobs.ge
- **Database Integration**: PostgreSQL database with Prisma ORM
- **JSON Storage**: Fallback JSON file storage
- **Optimized Performance**: 2.5-second delays for respectful scraping
- **Deduplication**: Automatic duplicate job removal

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
   DATABASE_URL="postgresql://username:password@localhost:5432/better_jobs?schema=public"
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

```sql
CREATE TABLE scraped_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id INTEGER UNIQUE NOT NULL,
  title VARCHAR NOT NULL,
  company VARCHAR NOT NULL,
  company_img_url VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  location VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  published_at TIMESTAMP NOT NULL,
  deadline_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Job Scraping

- `POST /jobs/scrape-all` - Scrape jobs and save to JSON file
- `POST /jobs/scrape-and-save` - Scrape jobs and save to database
- `GET /jobs/scraped` - Get scraped jobs from JSON file
- `GET /jobs/database` - Get scraped jobs from database
- `GET /jobs/database/count` - Get count of jobs in database

### General Job Search

- `GET /jobs` - Search jobs with query parameters

## Usage

### Start the application:

```bash
npm run start:dev
```

### Scrape jobs to database:

```bash
curl -X POST http://localhost:3000/jobs/scrape-and-save
```

### Get jobs from database:

```bash
curl http://localhost:3000/jobs/database
```

## Scraping Configuration

- **Delay**: 2.5 seconds between requests (partially compliant with robots.txt)
- **Pages**: 1 page per combination for optimal performance
- **Combinations**: All valid type × location × category combinations
- **Estimated Time**: ~56 minutes for complete scraping

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
│   ├── constants/        # Search parameters
│   ├── jobs.service.ts   # Business logic
│   ├── jobs.controller.ts # API endpoints
│   └── jobs-scraper.service.ts # Web scraping logic
├── database/             # Database operations
├── prisma/              # Prisma configuration
└── app.module.ts        # Main application module
```

## Environment Variables

| Variable       | Description                  | Example                                             |
| -------------- | ---------------------------- | --------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/better_jobs` |

## License

MIT

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobDto {
  @ApiProperty({ description: 'Job title' })
  title: string;

  @ApiProperty({ description: 'Job URL' })
  url: string;

  @ApiProperty({ description: 'Company name' })
  company: string;

  @ApiProperty({ description: 'Job dates information' })
  dates: string;

  @ApiProperty({ description: 'Job location' })
  location: string;

  @ApiPropertyOptional({ description: 'Published date' })
  publishedAt?: string;

  @ApiPropertyOptional({ description: 'Deadline date' })
  deadline?: string;

  @ApiPropertyOptional({ description: 'Company image URL' })
  companyImage?: string;

  @ApiPropertyOptional({ description: 'Job ID' })
  id?: string;
}

export class DatabaseJobDto {
  @ApiProperty({ description: 'Unique job ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'External job ID from jobs.ge' })
  external_id: number;

  @ApiProperty({ description: 'Job title' })
  title: string;

  @ApiProperty({ description: 'Company name' })
  company: string;

  @ApiProperty({ description: 'Company image URL' })
  company_img_url: string;

  @ApiProperty({ description: 'Job type' })
  type: string;

  @ApiProperty({ description: 'Job location' })
  location: string;

  @ApiProperty({ description: 'Job category' })
  category: string;

  @ApiPropertyOptional({ description: 'Job type ID reference' })
  type_id?: number;

  @ApiPropertyOptional({ description: 'Location ID reference' })
  location_id?: number;

  @ApiPropertyOptional({ description: 'Category ID reference' })
  category_id?: number;

  @ApiProperty({ description: 'Published date', type: Date })
  published_at: Date;

  @ApiProperty({ description: 'Deadline date', type: Date })
  deadline_at: Date;
}

export class CrawlOptionsDto {
  @ApiPropertyOptional({ description: 'Page number to scrape', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Search query', example: 'developer' })
  q?: string;

  @ApiPropertyOptional({ description: 'Category ID', example: '0' })
  cid?: string;

  @ApiPropertyOptional({ description: 'Location ID', example: '0' })
  lid?: string;

  @ApiPropertyOptional({ description: 'Job type ID', example: '0' })
  jid?: string;

  @ApiPropertyOptional({
    description: 'Maximum pages to scrape',
    example: 3,
    default: 3,
  })
  maxPages?: number;

  @ApiPropertyOptional({
    description: 'Starting page number',
    example: 1,
    default: 1,
  })
  startPage?: number;

  @ApiPropertyOptional({
    description: 'Delay between requests in milliseconds',
    example: 2000,
    default: 2000,
  })
  delayMs?: number;
}

export class CrawlResultDto {
  @ApiProperty({ type: [JobDto], description: 'Array of scraped jobs' })
  jobs: JobDto[];

  @ApiProperty({ description: 'Total number of pages scraped' })
  totalPages: number;

  @ApiProperty({ description: 'Total number of jobs found' })
  totalJobs: number;
}

export class JobTypeDto {
  @ApiProperty({ description: 'Job type ID' })
  id: number;

  @ApiProperty({ description: 'Job type name' })
  name: string;

  @ApiProperty({ description: 'Job type value' })
  value: number;
}

export class LocationDto {
  @ApiProperty({ description: 'Location ID' })
  id: number;

  @ApiProperty({ description: 'Location name' })
  name: string;

  @ApiProperty({ description: 'Location value' })
  value: number;
}

export class CategoryDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category value' })
  value: number;
}

export class JobCountDto {
  @ApiProperty({ description: 'Total number of jobs in database' })
  count: number;
}

export class ScrapeResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class SearchParamsStatusDto {
  @ApiProperty({ description: 'Whether search parameters are seeded' })
  isSeeded: boolean;

  @ApiProperty({ description: 'Number of job types' })
  typesCount: number;

  @ApiProperty({ description: 'Number of locations' })
  locationsCount: number;

  @ApiProperty({ description: 'Number of categories' })
  categoriesCount: number;
}

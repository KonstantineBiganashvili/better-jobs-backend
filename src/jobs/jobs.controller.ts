import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CrawlOptions, DatabaseJob } from './interfaces/job.interface';
import {
  CrawlResultDto,
  DatabaseJobDto,
  JobCountDto,
  ScrapeResponseDto,
  JobTypeDto,
  LocationDto,
  CategoryDto,
  SearchParamsStatusDto,
} from './dto/job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Get jobs with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'cid', required: false, type: String })
  @ApiQuery({ name: 'lid', required: false, type: String })
  @ApiQuery({ name: 'jid', required: false, type: String })
  @ApiQuery({ name: 'maxPages', required: false, type: Number })
  @ApiQuery({ name: 'startPage', required: false, type: Number })
  @ApiQuery({ name: 'delayMs', required: false, type: Number })
  @ApiResponse({ status: 200, type: CrawlResultDto })
  async getJobs(
    @Query('page') page?: string,
    @Query('q') q?: string,
    @Query('cid') cid?: string,
    @Query('lid') lid?: string,
    @Query('jid') jid?: string,
    @Query('maxPages') maxPages?: number,
    @Query('startPage') startPage?: number,
    @Query('delayMs') delayMs?: number,
  ) {
    const options: CrawlOptions = {
      page: page ? parseInt(page) : undefined,
      q: q || '',
      cid: cid || '0',
      lid: lid || '0',
      jid: jid || '0',
      maxPages: maxPages ? parseInt(maxPages.toString()) : 3,
      startPage: startPage ? parseInt(startPage.toString()) : 1,
      delayMs: delayMs ? parseInt(delayMs.toString()) : 2000,
    };

    return this.jobsService.getAllJobs(options);
  }

  @Post('scrape-all')
  @ApiOperation({ summary: 'Scrape all jobs' })
  @ApiResponse({ status: 200, type: ScrapeResponseDto })
  @ApiResponse({ status: 500 })
  async scrapeAllJobs(): Promise<{
    message: string;
  }> {
    await this.jobsService.scrapeAllJobs();

    return {
      message:
        'Comprehensive job scraping completed successfully and saved to database',
    };
  }

  @Get('scraped')
  @ApiOperation({ summary: 'Get all scraped jobs' })
  @ApiResponse({ status: 200, type: [DatabaseJobDto] })
  async getScrapedJobs(): Promise<DatabaseJob[]> {
    return this.jobsService.getAllScrapedJobsFromDatabase();
  }

  @Get('database')
  @ApiOperation({ summary: 'Get all jobs from database' })
  @ApiResponse({ status: 200, type: [DatabaseJobDto] })
  async getScrapedJobsFromDatabase(): Promise<DatabaseJob[]> {
    return this.jobsService.getAllScrapedJobsFromDatabase();
  }

  @Get('database/count')
  @ApiOperation({ summary: 'Get job count' })
  @ApiResponse({ status: 200, type: JobCountDto })
  async getScrapedJobsCount(): Promise<{ count: number }> {
    const count = await this.jobsService.getScrapedJobsCount();
    return { count };
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all job types' })
  @ApiResponse({ status: 200, type: [JobTypeDto] })
  async getJobTypes(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    return this.jobsService.getAllJobTypes();
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ status: 200, type: [LocationDto] })
  async getLocations(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    return this.jobsService.getAllLocations();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, type: [CategoryDto] })
  async getCategories(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    return this.jobsService.getAllCategories();
  }

  @Get('search-params-status')
  @ApiOperation({ summary: 'Get search parameters status' })
  @ApiResponse({ status: 200, type: SearchParamsStatusDto })
  async getSearchParamsStatus(): Promise<{
    isSeeded: boolean;
    typesCount: number;
    locationsCount: number;
    categoriesCount: number;
  }> {
    const isSeeded = await this.jobsService.isSearchParametersSeeded();
    const types = await this.jobsService.getAllJobTypes();
    const locations = await this.jobsService.getAllLocations();
    const categories = await this.jobsService.getAllCategories();

    return {
      isSeeded,
      typesCount: types.length,
      locationsCount: locations.length,
      categoriesCount: categories.length,
    };
  }
}

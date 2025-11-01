import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { JobsScraperService } from './jobs-scraper.service';
import {
  CrawlOptions,
  CrawlResult,
  DatabaseJob,
} from './interfaces/job.interface';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsScraperService: JobsScraperService,
    private readonly databaseService: DatabaseService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getAllJobs(options: CrawlOptions = {}): Promise<CrawlResult> {
    this.logger.debug('Getting all jobs with options', {
      context: JobsService.name,
      options,
    });
    return this.jobsScraperService.crawl(options);
  }

  async scrapeAllJobs(): Promise<void> {
    this.logger.info('Scraping all jobs triggered', {
      context: JobsService.name,
    });
    return this.jobsScraperService.scrapeAllJobs();
  }

  async saveJobsToDatabase(jobs: DatabaseJob[]): Promise<void> {
    this.logger.info(`Saving ${jobs.length} jobs to database`, {
      context: JobsService.name,
      jobCount: jobs.length,
    });
    return this.databaseService.saveScrapedJobs(jobs);
  }

  async getAllScrapedJobsFromDatabase(): Promise<DatabaseJob[]> {
    this.logger.debug('Getting all scraped jobs from database', {
      context: JobsService.name,
    });
    return this.databaseService.getAllScrapedJobs();
  }

  async getScrapedJobsCount(): Promise<number> {
    this.logger.debug('Getting scraped jobs count', {
      context: JobsService.name,
    });
    return this.databaseService.getScrapedJobsCount();
  }

  async getAllJobTypes(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    this.logger.debug('Getting all job types', {
      context: JobsService.name,
    });
    return this.databaseService.getAllJobTypes();
  }

  async getAllLocations(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    this.logger.debug('Getting all locations', {
      context: JobsService.name,
    });
    return this.databaseService.getAllLocations();
  }

  async getAllCategories(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    this.logger.debug('Getting all categories', {
      context: JobsService.name,
    });
    return this.databaseService.getAllCategories();
  }

  async isSearchParametersSeeded(): Promise<boolean> {
    this.logger.debug('Checking if search parameters are seeded', {
      context: JobsService.name,
    });

    const types = await this.databaseService.getAllJobTypes();
    const locations = await this.databaseService.getAllLocations();
    const categories = await this.databaseService.getAllCategories();

    const isSeeded =
      types.length > 0 && locations.length > 0 && categories.length > 0;

    this.logger.debug('Search parameters seeding status', {
      context: JobsService.name,
      isSeeded,
      typesCount: types.length,
      locationsCount: locations.length,
      categoriesCount: categories.length,
    });

    return isSeeded;
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseJob } from '../jobs/interfaces/job.interface';

@Injectable()
export class DatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async saveScrapedJobs(jobs: DatabaseJob[]): Promise<void> {
    this.logger.info(`Saving ${jobs.length} jobs to database`, {
      context: DatabaseService.name,
      jobCount: jobs.length,
    });

    try {
      let saved = 0;
      let updated = 0;

      for (const job of jobs) {
        const existing = await this.prisma.job.findUnique({
          where: { external_id: Number(job.external_id) },
        });

        await this.prisma.job.upsert({
          where: { external_id: Number(job.external_id) },
          update: {
            title: job.title,
            company: job.company,
            company_img_url: job.company_img_url,
            type: job.type,
            location: job.location,
            category: job.category,
            type_id: job.type_id,
            location_id: job.location_id,
            category_id: job.category_id,
            published_at: job.published_at,
            deadline_at: job.deadline_at,
          },
          create: {
            external_id: Number(job.external_id),
            title: job.title,
            company: job.company,
            company_img_url: job.company_img_url,
            type: job.type,
            location: job.location,
            category: job.category,
            type_id: job.type_id,
            location_id: job.location_id,
            category_id: job.category_id,
            published_at: job.published_at,
            deadline_at: job.deadline_at,
          },
        });

        if (existing) {
          updated++;
        } else {
          saved++;
        }
      }

      this.logger.info(`Successfully saved jobs to database`, {
        context: DatabaseService.name,
        total: jobs.length,
        saved,
        updated,
      });
    } catch (error) {
      this.logger.error(
        `Failed to save scraped jobs: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          jobCount: jobs.length,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(
        `Failed to save scraped jobs: ${(error as Error).message}`,
      );
    }
  }

  async getAllScrapedJobs(): Promise<DatabaseJob[]> {
    this.logger.debug('Fetching all scraped jobs from database', {
      context: DatabaseService.name,
    });

    try {
      const jobs = await this.prisma.job.findMany({
        orderBy: { created_at: 'desc' },
      });

      this.logger.debug(`Retrieved ${jobs.length} jobs from database`, {
        context: DatabaseService.name,
        jobCount: jobs.length,
      });

      return jobs.map(job => ({
        id: job.id,
        external_id: job.external_id,
        title: job.title,
        company: job.company,
        company_img_url: job.company_img_url,
        type: job.type,
        location: job.location,
        category: job.category,
        type_id: job.type_id ?? undefined,
        location_id: job.location_id ?? undefined,
        category_id: job.category_id ?? undefined,
        published_at: job.published_at,
        deadline_at: job.deadline_at,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch scraped jobs: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(
        `Failed to fetch scraped jobs: ${(error as Error).message}`,
      );
    }
  }

  async getScrapedJobsCount(): Promise<number> {
    this.logger.debug('Getting scraped jobs count', {
      context: DatabaseService.name,
    });

    try {
      const count = await this.prisma.job.count();
      this.logger.debug(`Jobs count retrieved: ${count}`, {
        context: DatabaseService.name,
        count,
      });
      return count;
    } catch (error) {
      this.logger.error(
        `Failed to get jobs count: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(`Failed to get jobs count: ${(error as Error).message}`);
    }
  }

  async deleteAllScrapedJobs(): Promise<void> {
    this.logger.warn('Deleting all scraped jobs from database', {
      context: DatabaseService.name,
    });

    try {
      const result = await this.prisma.job.deleteMany();
      this.logger.info(`Deleted ${result.count} jobs from database`, {
        context: DatabaseService.name,
        deletedCount: result.count,
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete scraped jobs: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(
        `Failed to delete scraped jobs: ${(error as Error).message}`,
      );
    }
  }

  async deleteExpiredJobs(): Promise<number> {
    const now = new Date();
    this.logger.info('Deleting jobs with passed deadlines', {
      context: DatabaseService.name,
      currentDate: now.toISOString(),
    });

    try {
      const result = await this.prisma.job.deleteMany({
        where: {
          deadline_at: {
            lt: now,
          },
        },
      });

      this.logger.info(`Deleted ${result.count} expired jobs from database`, {
        context: DatabaseService.name,
        deletedCount: result.count,
        currentDate: now.toISOString(),
      });

      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to delete expired jobs: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(
        `Failed to delete expired jobs: ${(error as Error).message}`,
      );
    }
  }

  async getAllJobTypes(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    this.logger.debug('Fetching all job types', {
      context: DatabaseService.name,
    });

    try {
      const types = await this.prisma.jobType.findMany({
        orderBy: { id: 'asc' },
      });
      this.logger.debug(`Retrieved ${types.length} job types`, {
        context: DatabaseService.name,
        count: types.length,
      });
      return types;
    } catch (error) {
      this.logger.error(
        `Failed to fetch job types: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(`Failed to fetch job types: ${(error as Error).message}`);
    }
  }

  async getAllLocations(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    this.logger.debug('Fetching all locations', {
      context: DatabaseService.name,
    });

    try {
      const locations = await this.prisma.location.findMany({
        orderBy: { id: 'asc' },
      });
      this.logger.debug(`Retrieved ${locations.length} locations`, {
        context: DatabaseService.name,
        count: locations.length,
      });
      return locations;
    } catch (error) {
      this.logger.error(
        `Failed to fetch locations: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(`Failed to fetch locations: ${(error as Error).message}`);
    }
  }

  async getAllCategories(): Promise<
    Array<{ id: number; name: string; value: number }>
  > {
    this.logger.debug('Fetching all categories', {
      context: DatabaseService.name,
    });

    try {
      const categories = await this.prisma.category.findMany({
        orderBy: { id: 'asc' },
      });
      this.logger.debug(`Retrieved ${categories.length} categories`, {
        context: DatabaseService.name,
        count: categories.length,
      });
      return categories;
    } catch (error) {
      this.logger.error(
        `Failed to fetch categories: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(
        `Failed to fetch categories: ${(error as Error).message}`,
      );
    }
  }

  async seedJobTypes(
    types: Array<{ id: number; name: string; value: number }>,
  ): Promise<void> {
    this.logger.info(`Seeding ${types.length} job types`, {
      context: DatabaseService.name,
      count: types.length,
    });

    try {
      const result = await this.prisma.jobType.createMany({
        data: types,
        skipDuplicates: true,
      });
      this.logger.info(`Successfully seeded ${result.count} job types`, {
        context: DatabaseService.name,
        created: result.count,
        skipped: types.length - result.count,
      });
    } catch (error) {
      this.logger.error(
        `Failed to seed job types: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          count: types.length,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(`Failed to seed job types: ${(error as Error).message}`);
    }
  }

  async seedLocations(
    locations: Array<{ id: number; name: string; value: number }>,
  ): Promise<void> {
    this.logger.info(`Seeding ${locations.length} locations`, {
      context: DatabaseService.name,
      count: locations.length,
    });

    try {
      const result = await this.prisma.location.createMany({
        data: locations,
        skipDuplicates: true,
      });
      this.logger.info(`Successfully seeded ${result.count} locations`, {
        context: DatabaseService.name,
        created: result.count,
        skipped: locations.length - result.count,
      });
    } catch (error) {
      this.logger.error(
        `Failed to seed locations: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          count: locations.length,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(`Failed to seed locations: ${(error as Error).message}`);
    }
  }

  async seedCategories(
    categories: Array<{ id: number; name: string; value: number }>,
  ): Promise<void> {
    this.logger.info(`Seeding ${categories.length} categories`, {
      context: DatabaseService.name,
      count: categories.length,
    });

    try {
      const result = await this.prisma.category.createMany({
        data: categories,
        skipDuplicates: true,
      });
      this.logger.info(`Successfully seeded ${result.count} categories`, {
        context: DatabaseService.name,
        created: result.count,
        skipped: categories.length - result.count,
      });
    } catch (error) {
      this.logger.error(
        `Failed to seed categories: ${(error as Error).message}`,
        {
          context: DatabaseService.name,
          count: categories.length,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(`Failed to seed categories: ${(error as Error).message}`);
    }
  }
}

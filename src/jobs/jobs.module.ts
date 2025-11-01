import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsScraperService } from './jobs-scraper.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [JobsService, JobsScraperService],
  controllers: [JobsController],
})
export class JobsModule {}

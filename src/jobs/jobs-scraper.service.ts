import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  Job,
  CrawlOptions,
  CrawlResult,
  DatabaseJob,
} from './interfaces/job.interface';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JobsScraperService {
  private readonly BASE_URL = 'https://jobs.ge/';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly databaseService: DatabaseService,
  ) {}

  private readonly client = axios.create({
    headers: {
      'User-Agent': 'BetterJobsGE/1.0 (+contact@email)',
      'Accept-Language': 'ka, en;q=0.8',
    },
    timeout: 20000,
  });

  private buildUrl({
    page = 1,
    q = '',
    cid = '0',
    lid = '0',
    jid = '0',
  } = {}): string {
    const url = new URL('https://jobs.ge/en/');
    url.searchParams.set('page', page.toString());
    url.searchParams.set('q', q);
    url.searchParams.set('cid', cid);
    url.searchParams.set('lid', lid);
    url.searchParams.set('jid', jid);
    return url.toString();
  }

  private async fetchPage(
    opts: Partial<CrawlOptions> & { page: number },
  ): Promise<{ html: string; listUrl: string }> {
    const listUrl = this.buildUrl(opts);
    this.logger.info(`Fetching page: ${listUrl}`, {
      context: JobsScraperService.name,
      listUrl,
    });

    try {
      const response = await this.client.get<string>(listUrl);
      const html = response.data;
      return { html, listUrl };
    } catch (error) {
      this.logger.error(
        `Failed to fetch page ${listUrl}: ${(error as Error).message}`,
        {
          context: JobsScraperService.name,
          listUrl,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
      throw new Error(`Failed to fetch page: ${(error as Error).message}`);
    }
  }

  private parseList(html: string): { jobs: Job[]; hasNext: boolean } {
    const $ = cheerio.load(html);
    const jobs: Job[] = [];

    const seen = new Set<string>();

    $("a[href*='view=jobs'][href*='id='], a[href*='&id=']").each((_, a) => {
      const $a = $(a);
      const href = $a.attr('href') || '';

      if (!/(?:view=jobs&id=|&id=)\d+/.test(href)) return;

      const absUrl = new URL(href, this.BASE_URL).toString();
      if (seen.has(absUrl)) return;
      seen.add(absUrl);

      const title = $a.text().trim();
      if (!title) return;

      const $row = $a.closest('tr');
      if (!$row.length) return;

      const tds = $row.find('td');

      let id: string | undefined;
      const idMatch = href.match(/(?:view=jobs&id=|&id=)(\d+)/);
      if (idMatch) {
        id = idMatch[1];
      } else {
        const firstCellImgId = tds.eq(0).find('img').attr('id');
        if (firstCellImgId) {
          id = firstCellImgId.trim();
        }
      }

      let company = '';
      $row.find('a[href*="view=client"]').each((_, el) => {
        const $el = $(el);
        const txt = $el.text().trim();
        if (txt && txt.length <= 80) {
          company = txt;
          return false;
        }
      });

      const publishedDate = tds.eq(4).text().trim();

      const deadlineDate = tds.eq(5).text().trim();

      let companyImage: string | undefined;
      const $img = tds.eq(2).find('img');
      if ($img.length) {
        const src = $img.attr('src') || '';
        if (src) {
          companyImage = new URL(src, this.BASE_URL).toString();
        }
      }

      const dates = [publishedDate, deadlineDate].filter(d => d).join(' - ');

      const location = '';

      jobs.push({
        title,
        url: absUrl,
        company,
        dates,
        location,
        publishedAt: publishedDate,
        deadline: deadlineDate,
        companyImage,
        id,
      });
    });

    let hasNext =
      $("a[rel='next']").length > 0 ||
      $(".pagination a:contains('შემდეგი')").length > 0 ||
      $(".pagination a:contains('Next')").length > 0 ||
      $('a.page_next, a.next').length > 0;

    if (!hasNext) {
      $('a[href*="page="]').each((_, el) => {
        const h = $(el).attr('href') || '';
        if (/page=\d+/.test(h)) {
          hasNext = true;
          return false;
        }
      });
    }

    this.logger.debug(`Parsed ${jobs.length} jobs from page`, {
      context: JobsScraperService.name,
      jobCount: jobs.length,
    });
    return { jobs, hasNext };
  }

  async crawl(options: CrawlOptions = {}): Promise<CrawlResult> {
    const {
      cid = '0',
      q = '',
      lid = '0',
      jid = '0',
      maxPages = 3,
      startPage = 1,
      delayMs = 2000,
    } = options;

    this.logger.info(`Starting crawl with options`, {
      context: JobsScraperService.name,
      cid,
      q,
      lid,
      jid,
      maxPages,
      startPage,
      delayMs,
    });

    let allJobs: Job[] = [];
    let currentPage = startPage;
    let totalPages = 0;

    for (let i = 0; i < maxPages; i++) {
      try {
        const { html } = await this.fetchPage({
          page: currentPage,
          q,
          cid,
          lid,
          jid,
        });
        const { jobs, hasNext } = this.parseList(html);

        allJobs = allJobs.concat(jobs);
        totalPages++;

        this.logger.debug(
          `Page ${currentPage}: Found ${jobs.length} jobs. Total so far: ${allJobs.length}`,
          {
            context: JobsScraperService.name,
            page: currentPage,
            jobsOnPage: jobs.length,
            totalJobs: allJobs.length,
          },
        );

        if (!hasNext) {
          this.logger.info('No more pages available', {
            context: JobsScraperService.name,
            lastPage: currentPage,
          });
          break;
        }

        currentPage++;

        if (i < maxPages - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        this.logger.error(
          `Error crawling page ${currentPage}: ${(error as Error).message}`,
          {
            context: JobsScraperService.name,
            page: currentPage,
            error: (error as Error).message,
            stack: (error as Error).stack,
          },
        );
        throw error;
      }
    }

    const result: CrawlResult = {
      jobs: allJobs,
      totalPages,
      totalJobs: allJobs.length,
    };

    this.logger.info(
      `Crawl completed: ${result.totalJobs} jobs from ${result.totalPages} pages`,
      {
        context: JobsScraperService.name,
        totalJobs: result.totalJobs,
        totalPages: result.totalPages,
      },
    );
    return result;
  }

  async searchJobs(
    searchQuery: string,
    options: Partial<CrawlOptions> = {},
  ): Promise<Job[]> {
    const result = await this.crawl({ ...options, q: searchQuery });
    return result.jobs;
  }

  async getJobsByCategory(
    categoryId: string,
    options: Partial<CrawlOptions> = {},
  ): Promise<Job[]> {
    const result = await this.crawl({ ...options, cid: categoryId });
    return result.jobs;
  }

  private convertJobToScrapedJob(
    job: Job,
    typeId: number,
    locationId: number,
    categoryId: number,
    typeName: string,
    locationName: string,
    categoryName: string,
  ): DatabaseJob {
    return {
      id: crypto.randomUUID(),
      external_id: job.id ? Number(job.id) : 0,
      title: job.title,
      company: job.company,
      company_img_url: job.companyImage || '',
      type: typeName,
      location: locationName,
      category: categoryName,
      type_id: typeId,
      location_id: locationId,
      category_id: categoryId,
      published_at: this.parseDate(job.publishedAt || ''),
      deadline_at: this.parseDate(job.deadline || ''),
    };
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    const georgianMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (georgianMatch) {
      const [, day, month, year] = georgianMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const englishMonthMatch = dateStr.match(/(\d{1,2})\s+(\w+)/);
    if (englishMonthMatch) {
      const [, dayStr, monthName] = englishMonthMatch;
      const day = parseInt(dayStr);

      const monthMap: { [key: string]: number } = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
      };

      const monthIndex = monthMap[monthName.toLowerCase()];
      if (monthIndex !== undefined) {
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, monthIndex, day);

        if (date < new Date()) {
          date.setFullYear(currentYear + 1);
        }

        const georgianDate = new Date(date.getTime() + 4 * 60 * 60 * 1000);
        return georgianDate;
      }
    }

    const now = new Date();
    return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  }

  private getSearchParamName(
    params: Array<{ id: number; name: string; value: number }>,
    value: number,
  ): string {
    const param = params.find(p => p.value === value);
    return param ? param.name : 'Unknown';
  }

  @Cron('0 0 * * *', {
    timeZone: 'Asia/Tbilisi',
  })
  async deleteExpiredJobs(): Promise<void> {
    this.logger.info('Starting cleanup of expired jobs', {
      context: JobsScraperService.name,
    });

    try {
      const deletedCount = await this.databaseService.deleteExpiredJobs();
      this.logger.info(
        `Cleanup completed. Deleted ${deletedCount} expired jobs`,
        {
          context: JobsScraperService.name,
          deletedCount,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired jobs: ${(error as Error).message}`,
        {
          context: JobsScraperService.name,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
      );
    }
  }

  @Cron('0 4 * * *', {
    timeZone: 'Asia/Tbilisi',
  })
  async scrapeAllJobs(): Promise<void> {
    this.logger.info('Starting optimized job scraping...', {
      context: JobsScraperService.name,
    });

    const allScrapedJobs = new Map<number, DatabaseJob>();

    const allJids = await this.databaseService.getAllJobTypes();
    const allLids = await this.databaseService.getAllLocations();
    const allCids = await this.databaseService.getAllCategories();

    const validJids = allJids.filter(j => j.value !== 0);
    const validLids = allLids.filter(l => l.value !== 0);
    const validCids = allCids.filter(c => c.value !== 0);

    const totalCombinations =
      validJids.length * validLids.length * validCids.length;
    this.logger.info(
      `Processing ${validJids.length} types × ${validLids.length} locations × ${validCids.length} categories = ${totalCombinations} combinations`,
      {
        context: JobsScraperService.name,
        types: validJids.length,
        locations: validLids.length,
        categories: validCids.length,
        totalCombinations,
      },
    );
    this.logger.info(
      'Using optimized approach: 1 page per combination, 5s delay between combinations (partially compliant with robots.txt)',
      {
        context: JobsScraperService.name,
      },
    );

    let processedCombinations = 0;

    for (const jid of validJids) {
      for (const lid of validLids) {
        for (const cid of validCids) {
          try {
            processedCombinations++;
            this.logger.debug(
              `Scraping [${processedCombinations}/${totalCombinations}]: Type=${jid.name}, Location=${lid.name}, Category=${cid.name}`,
              {
                context: JobsScraperService.name,
                combination: processedCombinations,
                total: totalCombinations,
                type: jid.name,
                location: lid.name,
                category: cid.name,
              },
            );

            const result = await this.crawl({
              jid: jid.value.toString(),
              lid: lid.value.toString(),
              cid: cid.value.toString(),
              maxPages: 1,
              delayMs: 0,
            });

            for (const job of result.jobs) {
              if (job.id) {
                const externalId = parseInt(job.id);
                const scrapedJob = this.convertJobToScrapedJob(
                  job,
                  jid.id,
                  lid.id,
                  cid.id,
                  jid.name,
                  lid.name,
                  cid.name,
                );

                if (!allScrapedJobs.has(externalId)) {
                  allScrapedJobs.set(externalId, scrapedJob);
                }
              }
            }

            if (processedCombinations % 50 === 0) {
              this.logger.info(
                `Progress: ${processedCombinations}/${totalCombinations} combinations processed. Found ${allScrapedJobs.size} unique jobs so far.`,
                {
                  context: JobsScraperService.name,
                  processed: processedCombinations,
                  total: totalCombinations,
                  uniqueJobs: allScrapedJobs.size,
                },
              );
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (error) {
            this.logger.error(
              `Error scraping combination: ${jid.name}/${lid.name}/${cid.name} - ${(error as Error).message}`,
              {
                context: JobsScraperService.name,
                type: jid.name,
                location: lid.name,
                category: cid.name,
                error: (error as Error).message,
                stack: (error as Error).stack,
              },
            );
          }
        }
      }
    }

    const finalJobs = Array.from(allScrapedJobs.values());
    this.logger.info(
      `Optimized scraping completed. Processed ${processedCombinations} combinations. Total unique jobs: ${finalJobs.length}`,
      {
        context: JobsScraperService.name,
        processedCombinations,
        totalUniqueJobs: finalJobs.length,
      },
    );

    if (finalJobs.length > 0) {
      this.logger.info(`Saving ${finalJobs.length} jobs to database...`, {
        context: JobsScraperService.name,
        jobCount: finalJobs.length,
      });
      await this.databaseService.saveScrapedJobs(finalJobs);
      this.logger.info('Successfully saved all jobs to database', {
        context: JobsScraperService.name,
        jobCount: finalJobs.length,
      });
    } else {
      this.logger.warn('No jobs found to save', {
        context: JobsScraperService.name,
      });
    }
  }
}

export interface Job {
  title: string;
  url: string;
  company: string;
  dates: string;
  location: string;
  publishedAt?: string;
  deadline?: string;
  companyImage?: string;
  id?: string;
}

export interface DatabaseJob {
  id: string;
  external_id: number;
  title: string;
  company: string;
  company_img_url: string;
  type: string;
  location: string;
  category: string;
  type_id?: number;
  location_id?: number;
  category_id?: number;
  published_at: Date;
  deadline_at: Date;
}

export interface CrawlOptions {
  page?: number;
  q?: string;
  cid?: string;
  lid?: string;
  jid?: string;
  maxPages?: number;
  startPage?: number;
  delayMs?: number;
}

export interface CrawlResult {
  jobs: Job[];
  totalPages: number;
  totalJobs: number;
}

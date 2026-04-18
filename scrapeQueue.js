import { randomUUID } from "node:crypto";
import { scrapeAll, scrapeOne } from "./scraper.js";

const jobs = new Map();
const queue = [];
let activeJobId = null;
const MAX_JOB_HISTORY = 300;

const TERMINAL_STATES = new Set(["COMPLETED", "FAILED"]);

function nowIso() {
  return new Date().toISOString();
}

function getPublicJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    type: job.type,
    officialId: job.officialId || null,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt || null,
    completedAt: job.completedAt || null,
    error: job.error || null,
    result: job.result || null,
    logs: job.logs,
  };
}

function appendLog(job, message) {
  job.logs.push(`[${nowIso()}] ${message}`);
  if (job.logs.length > 80) {
    job.logs.shift();
  }
}

function updateJob(job, patch) {
  Object.assign(job, patch, { updatedAt: nowIso() });
}

function pruneJobHistory() {
  if (jobs.size <= MAX_JOB_HISTORY) return;

  const removable = Array.from(jobs.values())
    .filter((job) => TERMINAL_STATES.has(job.status))
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  while (jobs.size > MAX_JOB_HISTORY && removable.length > 0) {
    const oldest = removable.shift();
    if (!oldest) break;
    jobs.delete(oldest.id);
  }
}

async function processQueue() {
  if (activeJobId || queue.length === 0) return;

  const nextJob = queue.shift();
  activeJobId = nextJob.id;

  updateJob(nextJob, {
    status: "RUNNING",
    progress: 3,
    startedAt: nowIso(),
  });
  appendLog(nextJob, "Job started");

  try {
    if (nextJob.type === "FULL_NEWS_SCRAPE") {
      const result = await scrapeAll({
        onProgress: ({ current, total, officialName, headlinesCount, updated }) => {
          const progress = Math.max(5, Math.min(95, Math.round((current / Math.max(total, 1)) * 100)));
          updateJob(nextJob, { progress });
          appendLog(
            nextJob,
            `Processed ${current}/${total}: ${officialName} (${headlinesCount} headlines${updated ? ", updated" : ""})`
          );
        },
      });

      updateJob(nextJob, {
        status: "COMPLETED",
        progress: 100,
        result,
        completedAt: nowIso(),
      });
      appendLog(nextJob, "Full scrape completed");
    } else if (nextJob.type === "OFFICIAL_NEWS_SCRAPE") {
      if (!nextJob.officialId) {
        throw new Error("officialId is required for OFFICIAL_NEWS_SCRAPE");
      }

      updateJob(nextJob, { progress: 20 });
      appendLog(nextJob, `Scraping official ${nextJob.officialId}`);

      const result = await scrapeOne(nextJob.officialId, {
        onProgress: ({ current, total, officialName }) => {
          const progress = Math.max(25, Math.min(95, Math.round((current / Math.max(total, 1)) * 100)));
          updateJob(nextJob, { progress });
          appendLog(nextJob, `Progress: ${officialName || nextJob.officialId} (${current}/${total})`);
        },
      });

      if (!result.ok) {
        throw new Error(result.reason || "Single official scrape failed");
      }

      updateJob(nextJob, {
        status: "COMPLETED",
        progress: 100,
        result,
        completedAt: nowIso(),
      });
      appendLog(nextJob, `Official scrape completed (${result.headlinesCount} headlines)`);
    } else {
      throw new Error(`Unsupported scrape job type: ${nextJob.type}`);
    }
  } catch (error) {
    updateJob(nextJob, {
      status: "FAILED",
      progress: Math.min(nextJob.progress, 100),
      error: error.message,
      completedAt: nowIso(),
    });
    appendLog(nextJob, `Job failed: ${error.message}`);
  } finally {
    activeJobId = null;
    processQueue().catch((error) => {
      console.error("[ScrapeQueue] processing error", error);
    });
  }
}

export function enqueueScrapeJob({ type, officialId } = {}) {
  const normalizedType = String(type || "FULL_NEWS_SCRAPE").toUpperCase();
  const normalizedOfficialId = officialId ? String(officialId).trim() : null;

  const job = {
    id: randomUUID(),
    type: normalizedType,
    officialId: normalizedOfficialId,
    status: "QUEUED",
    progress: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    startedAt: null,
    completedAt: null,
    error: null,
    result: null,
    logs: [],
  };

  appendLog(job, "Job queued");
  jobs.set(job.id, job);
  queue.push(job);
  pruneJobHistory();

  processQueue().catch((error) => {
    console.error("[ScrapeQueue] failed to start processor", error);
  });

  return getPublicJob(job);
}

export function getScrapeJob(jobId) {
  const job = jobs.get(String(jobId));
  return getPublicJob(job);
}

export function listScrapeJobs(limit = 20) {
  const max = Math.max(1, Math.min(Number(limit) || 20, 100));

  return Array.from(jobs.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, max)
    .map(getPublicJob);
}

export function getScrapeQueueStats() {
  let queued = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;

  for (const job of jobs.values()) {
    if (job.status === "QUEUED") queued += 1;
    else if (job.status === "RUNNING") running += 1;
    else if (job.status === "COMPLETED") completed += 1;
    else if (job.status === "FAILED") failed += 1;
  }

  return {
    queued,
    running,
    completed,
    failed,
    activeJobId,
    totalJobs: jobs.size,
  };
}

export function isTerminalStatus(status) {
  return TERMINAL_STATES.has(status);
}

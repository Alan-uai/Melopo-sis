import type { VerificationJob, VerificationJobStatus } from '@/ai/types';

const JOBS_STORAGE_KEY = 'melopoeisis_verification_jobs';
const SESSION_STORAGE_KEY = 'melopoeisis_active_job';

type StoredJob = {
  jobId: string;
  poemId?: string;
  type: 'grammar' | 'tone';
  status: VerificationJobStatus;
  textHash: string;
  createdAt: number;
  completedAt?: number;
  result?: { suggestions: any[]; modelUsed?: string };
  error?: string;
};

export function saveJobToLocal(job: StoredJob) {
  try {
    const existing = getJobsFromLocal();
    existing.set(job.jobId, job);
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(Array.from(existing.entries())));
  } catch {}
}

export function getJobsFromLocal(): Map<string, StoredJob> {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return new Map();
    return new Map(JSON.parse(raw));
  } catch {
    return new Map();
  }
}

export function getJobFromLocal(jobId: string): StoredJob | undefined {
  return getJobsFromLocal().get(jobId);
}

export function removeJobFromLocal(jobId: string) {
  try {
    const existing = getJobsFromLocal();
    existing.delete(jobId);
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(Array.from(existing.entries())));
  } catch {}
}

export function saveActiveJobId(jobId: string | null) {
  try {
    if (jobId) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, jobId);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {}
}

export function getActiveJobId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function findJobsByPoem(poemId?: string): StoredJob[] {
  if (!poemId) return [];
  const all = getJobsFromLocal();
  return Array.from(all.values())
    .filter(j => j.poemId === poemId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function findIncompleteJobs(poemId?: string): StoredJob[] {
  return findJobsByPoem(poemId).filter(j => j.status === 'pending' || j.status === 'processing');
}

export function findLatestCompletedJob(poemId?: string, type?: 'grammar' | 'tone'): StoredJob | undefined {
  const jobs = findJobsByPoem(poemId);
  return jobs.find(j => j.status === 'completed' && (!type || j.type === type));
}

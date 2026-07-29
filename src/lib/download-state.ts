export interface DownloadTask {
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: DownloadResult;
  url: string;
  title: string;
  channel: string;
}

export interface DownloadResult {
  title: string;
  channel: string;
  url: string;
  file?: string;
}

export interface DownloadRequestBody {
  url?: string;
  title?: string;
  channel?: string;
}

export interface StatusResponse {
  status: string;
  progress: number;
  error?: string;
  result?: DownloadResult;
}

export interface BatchTrack {
  url: string;
  title?: string;
  channel?: string;
}

export interface BatchRequestBody {
  tracks?: BatchTrack[];
}

declare global {
  var __downloadTasks: Map<string, DownloadTask> | undefined;
  var __activeDownloads: number | undefined;
  var __completedDownloads: number | undefined;
}

const MAX_CONCURRENT = 3;

export function getDownloadTasks(): Map<string, DownloadTask> {
  if (!globalThis.__downloadTasks) {
    globalThis.__downloadTasks = new Map<string, DownloadTask>();
  }
  return globalThis.__downloadTasks;
}

export function getActiveCount(): number {
  if (globalThis.__activeDownloads === undefined) {
    globalThis.__activeDownloads = 0;
  }
  return globalThis.__activeDownloads;
}

export function setActiveCount(count: number): void {
  globalThis.__activeDownloads = count;
}

export function incrementActive(): number {
  const current = getActiveCount();
  setActiveCount(current + 1);
  return current + 1;
}

export function getCompletedCount(): number {
  if (globalThis.__completedDownloads === undefined) {
    globalThis.__completedDownloads = 0;
  }
  return globalThis.__completedDownloads;
}

export function incrementCompleted(): number {
  const current = getCompletedCount();
  globalThis.__completedDownloads = current + 1;
  return current + 1;
}

export function decrementActive(): number {
  const current = getActiveCount();
  setActiveCount(Math.max(0, current - 1));
  return Math.max(0, current - 1);
}

export function generateTaskId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function canStartDownload(): boolean {
  return getActiveCount() < MAX_CONCURRENT;
}

export function cleanupOldTasks(maxAgeMs: number = 3600000): void {
  const tasks = getDownloadTasks();
  const cutoff = Date.now() - maxAgeMs;
  for (const [id, task] of tasks) {
    if (task.status === 'completed' || task.status === 'error') {
      // Tasks don't store timestamps, so we use a simple approach:
      // keep only the last 50 tasks, remove oldest completed/error ones
      if (tasks.size > 50) {
        tasks.delete(id);
      }
    }
  }
}

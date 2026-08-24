export interface ScanTask {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'aborted';
  logs: string[];
  addedCount: number;
  sourceId: string | null;
  startedAt: string;
  abortController?: AbortController;
}

const globalForTasks = globalThis as unknown as {
  activeTasks: Record<string, ScanTask>;
};

export const activeTasks = globalForTasks.activeTasks || {};

if (process.env.NODE_ENV !== 'production') {
  globalForTasks.activeTasks = activeTasks;
}

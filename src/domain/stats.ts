import type { Task } from './schema';

/** Процент без деления на ноль и NaN/Infinity. Результат всегда в диапазоне 0..100. */
export function calculatePercentage(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total)) return 0;
  if (total <= 0 || part <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

export interface CompletionStats {
  total: number;
  done: number;
  percent: number;
}

export function getCompletionStats(tasks: readonly Task[]): CompletionStats {
  const done = tasks.filter((task) => task.completed).length;
  return { total: tasks.length, done, percent: calculatePercentage(done, tasks.length) };
}

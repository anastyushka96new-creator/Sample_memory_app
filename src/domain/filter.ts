import { isSearchMatch } from './search';
import type { Tag, Task } from './schema';

export type StatusFilter = 'all' | 'active' | 'done';
export type TagFilter =
  | { readonly kind: 'any' }
  | { readonly kind: 'none' }
  | { readonly kind: 'tag'; readonly id: string };

export interface TaskFilter {
  readonly status: StatusFilter;
  readonly tag: TagFilter;
  readonly query: string;
}

export const DEFAULT_FILTER: TaskFilter = { status: 'all', tag: { kind: 'any' }, query: '' };

function matchesStatus(task: Task, status: StatusFilter): boolean {
  if (status === 'all') return true;
  return status === 'done' ? task.completed : !task.completed;
}

function matchesTag(task: Task, tag: TagFilter): boolean {
  if (tag.kind === 'any') return true;
  if (tag.kind === 'none') return task.tagId === null;
  return task.tagId === tag.id;
}

/** Вычисляется во время рендера; в state "отфильтрованный список" не хранится. */
export function selectVisibleTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  return tasks.filter(
    (task) =>
      matchesStatus(task, filter.status) &&
      matchesTag(task, filter.tag) &&
      isSearchMatch(task.title, filter.query),
  );
}

/** Фильтр по удалённому тегу превращается в "любой тег" (иначе список внезапно опустеет). */
export function normalizeFilter(filter: TaskFilter, tags: readonly Tag[]): TaskFilter {
  const { tag } = filter;
  if (tag.kind === 'tag' && !tags.some((item) => item.id === tag.id)) {
    return { ...filter, tag: { kind: 'any' } };
  }
  return filter;
}

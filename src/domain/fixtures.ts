import { createEmptyState, type AppState, type Tag, type Task } from './schema';

/** Детерминированный валидный UUID v4 для тестов: uuid(1), uuid(2), ... */
export function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
}

export function makeTag(n: number, overrides: Partial<Tag> = {}): Tag {
  return { id: uuid(n), name: `Тег ${n}`, color: '#00ff00', ...overrides };
}

export function makeTask(n: number, overrides: Partial<Task> = {}): Task {
  return {
    id: uuid(n),
    title: `Задача ${n}`,
    completed: false,
    priority: 'medium',
    tagId: null,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

export function makeState(parts: { tags?: Tag[]; tasks?: Task[] } = {}): AppState {
  return { ...createEmptyState(), tags: parts.tags ?? [], tasks: parts.tasks ?? [] };
}

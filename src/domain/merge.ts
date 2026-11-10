import { checkIntegrity } from './integrity';
import type { Result } from './result';
import type { AppState, Tag, Task } from './schema';

function mergeTags(current: readonly Tag[], incoming: readonly Tag[]): Tag[] {
  const known = new Set(current.map((tag) => tag.id));
  return [...current, ...incoming.filter((tag) => !known.has(tag.id))];
}

/** При совпадении ID побеждает задача с большим updatedAt; при равенстве — текущая. */
function mergeTasks(current: readonly Task[], incoming: readonly Task[]): Task[] {
  const incomingById = new Map(incoming.map((task) => [task.id, task]));
  const currentIds = new Set(current.map((task) => task.id));

  const updated = current.map((task) => {
    const candidate = incomingById.get(task.id);
    return candidate !== undefined && candidate.updatedAt > task.updatedAt ? candidate : task;
  });
  return [...updated, ...incoming.filter((task) => !currentIds.has(task.id))];
}

/** Объединение двух состояний с проверкой целостности результата. */
export function mergeStates(current: AppState, incoming: AppState): Result<AppState> {
  return checkIntegrity({
    ...current,
    tags: mergeTags(current.tags, incoming.tags),
    tasks: mergeTasks(current.tasks, incoming.tasks),
  });
}

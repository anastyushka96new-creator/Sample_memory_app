import { err, ok, type Result } from './result';
import { LIMITS, type AppState } from './schema';

function findDuplicate(ids: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return null;
}

/**
 * Проверки, которые не выразить схемой одной сущности:
 * лимиты, уникальность ID, ссылки задач на существующие теги.
 */
export function checkIntegrity(state: AppState): Result<AppState> {
  if (state.tags.length > LIMITS.maxTags) return err(`Слишком много тегов (максимум ${LIMITS.maxTags})`);
  if (state.tasks.length > LIMITS.maxTasks) return err(`Слишком много задач (максимум ${LIMITS.maxTasks})`);

  const duplicateTag = findDuplicate(state.tags.map((tag) => tag.id));
  if (duplicateTag !== null) return err(`Повторяющийся ID тега: ${duplicateTag}`);

  const duplicateTask = findDuplicate(state.tasks.map((task) => task.id));
  if (duplicateTask !== null) return err(`Повторяющийся ID задачи: ${duplicateTask}`);

  const tagIds = new Set(state.tags.map((tag) => tag.id));
  for (const task of state.tasks) {
    if (task.tagId !== null && !tagIds.has(task.tagId)) {
      return err(`Задача ${task.id} ссылается на несуществующий тег ${task.tagId}`);
    }
  }
  return ok(state);
}

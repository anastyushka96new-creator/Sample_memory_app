import { err, ok, type Result } from './result';
import { normalizeText } from './search';
import { LIMITS, type AppState } from './schema';
import { parseTagName } from './validation';

/** ID приходит снаружи (infrastructure/ids.ts), поэтому функция чистая и детерминированная. */
export function createTag(
  state: AppState,
  rawName: string,
  color: string,
  id: string,
): Result<AppState> {
  const name = parseTagName(rawName);
  if (!name.ok) return name;
  if (state.tags.length >= LIMITS.maxTags) return err(`Достигнут лимит тегов (${LIMITS.maxTags})`);

  const normalized = normalizeText(name.value);
  if (state.tags.some((tag) => normalizeText(tag.name) === normalized)) {
    return err('Тег с таким названием уже есть');
  }
  return ok({ ...state, tags: [...state.tags, { id, name: name.value, color }] });
}

/** Удаляет тег и обнуляет tagId у всех связанных задач (каскад). */
export function deleteTagCascade(state: AppState, tagId: string, now: number): Result<AppState> {
  if (!state.tags.some((tag) => tag.id === tagId)) return err('Тег не найден');
  return ok({
    ...state,
    tags: state.tags.filter((tag) => tag.id !== tagId),
    tasks: state.tasks.map((task) =>
      task.tagId === tagId ? { ...task, tagId: null, updatedAt: now } : task,
    ),
  });
}

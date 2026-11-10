import { err, ok, type Result } from './result';
import { CURRENT_SCHEMA_VERSION } from './schema';

type Json = Record<string, unknown>;

/** Чистая функция: принимает данные версии N, возвращает данные версии N+1. */
export type MigrationStep = (data: Json) => Json;
export type MigrationRegistry = Readonly<Record<number, MigrationStep>>;

/**
 * Реестр миграций. Ключ — версия, ИЗ которой переходим.
 * Пример при переходе на v2:  1: (data) => ({ ...data, tasks: addArchivedFlag(data.tasks) })
 * Сейчас актуальна v1, поэтому реестр пуст.
 */
export const MIGRATIONS: MigrationRegistry = {};

export function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Данные без schemaVersion считаются версией 1 (самый первый формат). */
export function readSchemaVersion(raw: Json): number | null {
  const version = raw['schemaVersion'];
  if (version === undefined) return 1;
  if (typeof version === 'number' && Number.isInteger(version) && version >= 1) return version;
  return null;
}

function runStep(step: MigrationStep, data: Json, fromVersion: number): Result<Json> {
  try {
    return ok({ ...step(data), schemaVersion: fromVersion + 1 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'неизвестная ошибка';
    return err(`Миграция с версии ${fromVersion} не удалась: ${reason}`);
  }
}

export function migrateState(
  raw: unknown,
  target: number = CURRENT_SCHEMA_VERSION,
  registry: MigrationRegistry = MIGRATIONS,
): Result<unknown> {
  if (!isRecord(raw)) return err('Ожидался объект состояния приложения');

  const version = readSchemaVersion(raw);
  if (version === null) return err('Поле schemaVersion повреждено');
  if (version > target) {
    return err(
      `Данные созданы более новой версией приложения (схема v${version}, поддерживается до v${target})`,
    );
  }

  let data: Json = { ...raw, schemaVersion: version };
  for (let from = version; from < target; from++) {
    const step = registry[from];
    if (step === undefined) return err(`Нет миграции с версии ${from}`);
    const result = runStep(step, data, from);
    if (!result.ok) return result;
    data = result.value;
  }
  return ok(data);
}

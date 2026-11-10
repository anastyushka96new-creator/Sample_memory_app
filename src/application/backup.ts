import { mergeStates } from '../domain/merge';
import { err, ok, type Result } from '../domain/result';
import type { AppState } from '../domain/schema';
import type { BackupFile, Clock, RawStore } from './ports';
import { parseStateJson } from './storedState';

export const MAX_IMPORT_BYTES = 3 * 1024 * 1024;

export function createBackupFile(state: AppState, now: number): BackupFile {
  const day = new Date(now).toISOString().slice(0, 10);
  return { filename: `vibeapp-backup-${day}.json`, content: JSON.stringify(state, null, 2) };
}

/** Проверка размера, JSON, миграция, схема и целостность. Ничего не пишет в хранилище. */
export function parseBackup(raw: string, maxBytes: number = MAX_IMPORT_BYTES): Result<AppState> {
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return err(`Файл больше ${Math.round(maxBytes / 1024 / 1024)} МБ`);
  }
  return parseStateJson(raw);
}

export type ImportMode = 'replace' | 'merge';

export interface ImportPlan {
  readonly state: AppState;
  readonly safetyBackupKey: string;
}

/**
 * Импорт всегда начинается с копии ТЕКУЩИХ данных. Нет копии — нет импорта.
 * Возвращает новое состояние, но само его не применяет: решение принимает вызывающий код.
 */
export interface ImportDeps {
  readonly store: RawStore;
  readonly clock: Clock;
}

export function planImport(
  { store, clock }: ImportDeps,
  current: AppState,
  incoming: AppState,
  mode: ImportMode,
): Result<ImportPlan> {
  const next = mode === 'replace' ? ok(incoming) : mergeStates(current, incoming);
  if (!next.ok) return next;

  const backup = store.writeBackup(JSON.stringify(current), clock.now());
  if (!backup.ok) {
    return err(`Импорт отменён: не удалось сохранить копию текущих данных (${backup.error})`);
  }
  return ok({ state: next.value, safetyBackupKey: backup.value });
}

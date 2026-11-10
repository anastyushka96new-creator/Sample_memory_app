import { parseAppState } from '../domain/parse';
import { err, type Result } from '../domain/result';
import { createEmptyState, type AppState } from '../domain/schema';
import type { Clock, RawStore } from './ports';

/** Как завершилась загрузка. UI по `kind` решает, что показать пользователю. */
export type LoadReport =
  | { readonly kind: 'fresh'; readonly state: AppState; readonly saveAllowed: true }
  | { readonly kind: 'loaded'; readonly state: AppState; readonly saveAllowed: true }
  | {
      readonly kind: 'recovered';
      readonly state: AppState;
      readonly saveAllowed: boolean;
      readonly reason: string;
      readonly backupKey: string | null;
    }
  | {
      readonly kind: 'unreadable';
      readonly state: AppState;
      readonly saveAllowed: false;
      readonly reason: string;
    };

export function parseStateJson(json: string): Result<AppState> {
  try {
    return parseAppState(JSON.parse(json));
  } catch {
    return err('Файл содержит повреждённый JSON');
  }
}

/**
 * Правила безопасности:
 *  - данные, которые не удалось прочитать, НИКОГДА не затираются молча;
 *  - если копию повреждённых данных сохранить не удалось, запись в хранилище блокируется
 *    (иначе первое же сохранение уничтожило бы единственный экземпляр).
 */
export function loadState(store: RawStore, clock: Clock): LoadReport {
  const read = store.read();
  if (!read.ok) {
    return { kind: 'unreadable', state: createEmptyState(), saveAllowed: false, reason: read.error };
  }
  if (read.value === null) return { kind: 'fresh', state: createEmptyState(), saveAllowed: true };

  const parsed = parseStateJson(read.value);
  if (parsed.ok) return { kind: 'loaded', state: parsed.value, saveAllowed: true };

  const backup = store.writeBackup(read.value, clock.now());
  return {
    kind: 'recovered',
    state: createEmptyState(),
    saveAllowed: backup.ok,
    reason: parsed.error,
    backupKey: backup.ok ? backup.value : null,
  };
}

export function saveState(store: RawStore, state: AppState): Result<void> {
  return store.write(JSON.stringify(state));
}

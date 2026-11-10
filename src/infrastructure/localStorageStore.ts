import type { RawStore } from '../application/ports';
import { err, ok, type Result } from '../domain/result';

/** Ключ НЕ содержит версию схемы: версия лежит внутри данных (schemaVersion). */
export const STORAGE_KEY = 'vibe_app_state';
export const BACKUP_PREFIX = `${STORAGE_KEY}_backup_`;
export const MAX_BACKUPS = 3;

function describeError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Недостаточно места в хранилище (QuotaExceededError)';
  }
  return error instanceof Error ? error.message : 'неизвестная ошибка хранилища';
}

function attempt<T>(action: () => T): Result<T> {
  try {
    return ok(action());
  } catch (error) {
    return err(describeError(error));
  }
}

function listBackupKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key?.startsWith(BACKUP_PREFIX) === true) keys.push(key);
  }
  return keys;
}

function backupTimestamp(key: string): number {
  return Number(key.slice(BACKUP_PREFIX.length).split('_')[0]);
}

function pruneBackups(storage: Storage): void {
  const keys = listBackupKeys(storage).sort(
    (a, b) => backupTimestamp(a) - backupTimestamp(b) || a.localeCompare(b),
  );
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_BACKUPS))) {
    storage.removeItem(key);
  }
}

function freeBackupKey(storage: Storage, timestamp: number): string {
  let key = `${BACKUP_PREFIX}${timestamp}`;
  for (let suffix = 1; storage.getItem(key) !== null; suffix++) {
    key = `${BACKUP_PREFIX}${timestamp}_${suffix}`;
  }
  return key;
}

/**
 * `getStorage` вызывается внутри try: само обращение к window.localStorage
 * может бросить SecurityError (запрещённые cookie, приватные режимы).
 */
export function createLocalStorageStore(
  getStorage: () => Storage = () => window.localStorage,
): RawStore {
  return {
    read: () => attempt(() => getStorage().getItem(STORAGE_KEY)),
    write: (json) =>
      attempt(() => {
        getStorage().setItem(STORAGE_KEY, json);
      }),
    writeBackup: (json, timestamp) =>
      attempt(() => {
        const storage = getStorage();
        const key = freeBackupKey(storage, timestamp);
        storage.setItem(key, json);
        pruneBackups(storage);
        return key;
      }),
  };
}

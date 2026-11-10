import { err, ok } from '../domain/result';
import type { Clock, IdGenerator, RawStore } from './ports';

export interface MemoryStoreOptions {
  readonly initial?: string | null;
  readonly failRead?: boolean;
  readonly failWrite?: boolean;
  readonly failBackup?: boolean;
}

/** Хранилище в памяти для тестов application и ui. Доступно содержимое через поля. */
export interface MemoryStore extends RawStore {
  value: string | null;
  readonly backups: Map<string, string>;
  writes: number;
}

export function createMemoryStore(options: MemoryStoreOptions = {}): MemoryStore {
  const backups = new Map<string, string>();
  const store: MemoryStore = {
    value: options.initial ?? null,
    backups,
    writes: 0,
    read: () => (options.failRead === true ? err('чтение недоступно') : ok(store.value)),
    write: (json) => {
      if (options.failWrite === true) return err('QuotaExceededError');
      store.value = json;
      store.writes += 1;
      return ok(undefined);
    },
    writeBackup: (json, timestamp) => {
      if (options.failBackup === true) return err('нет места для копии');
      const key = `backup_${timestamp}_${backups.size}`;
      backups.set(key, json);
      return ok(key);
    },
  };
  return store;
}

export function createFixedClock(now: number): Clock {
  return { now: () => now };
}

/** Генератор детерминированных UUID v4: 00000000-0000-4000-8000-000000000001, ... */
export function createSequentialIds(start = 1): IdGenerator {
  let counter = start;
  return {
    next: () => {
      const id = `00000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`;
      counter += 1;
      return id;
    },
  };
}

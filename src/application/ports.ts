import type { Result } from '../domain/result';

/**
 * Соглашение: методы в интерфейсах объявляются как свойства-функции (`name: () => T`),
 * иначе деструктуризация `const { read } = store` теряет `this` (правило unbound-method).
 *
 * Низкоуровневое хранилище "одна строка JSON". Реализуется в infrastructure.
 * Все методы возвращают Result и НИКОГДА не бросают исключений.
 */
export interface RawStore {
  /** `null` в value означает "данных ещё нет". */
  read: () => Result<string | null>;
  /** Ошибка (например, переполнение квоты) приходит как err, а не как исключение. */
  write: (json: string) => Result<void>;
  /** Кладёт копию под отдельный ключ и возвращает этот ключ. Хранит ограниченное число копий. */
  writeBackup: (json: string, timestamp: number) => Result<string>;
}

export interface Clock {
  now: () => number;
}

export interface IdGenerator {
  next: () => string;
}

/** Событие "приложение уходит в фон" (на Android — appStateChange). */
export interface AppLifecycle {
  /** Возвращает функцию отписки. */
  onBackground: (callback: () => void) => () => void;
}

export interface BackupFile {
  readonly filename: string;
  readonly content: string;
}

/** Выгрузка файла резервной копии пользователю (браузер: скачивание; Android: Share-диалог). */
export interface FileExporter {
  save: (file: BackupFile) => Result<void>;
}

/** Все внешние зависимости приложения одним объектом. Собирается в src/app/services.ts. */
export interface AppServices {
  readonly store: RawStore;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly lifecycle: AppLifecycle;
  readonly exporter: FileExporter;
}

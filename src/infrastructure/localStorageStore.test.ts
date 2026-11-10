import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BACKUP_PREFIX, MAX_BACKUPS, STORAGE_KEY, createLocalStorageStore } from './localStorageStore';

function backupKeys(): string[] {
  return Object.keys(localStorage).filter((key) => key.startsWith(BACKUP_PREFIX));
}

describe('createLocalStorageStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('read: null, пока данных нет, затем записанная строка', () => {
    const store = createLocalStorageStore();
    expect(store.read()).toStrictEqual({ ok: true, value: null });
    store.write('{"a":1}');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{"a":1}');
    expect(store.read()).toStrictEqual({ ok: true, value: '{"a":1}' });
  });

  it('write: переполнение квоты возвращается как ошибка, а не исключение', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const result = createLocalStorageStore().write('x');
    expect(!result.ok && result.error).toContain('QuotaExceededError');
  });

  it('read: SecurityError при самом обращении к localStorage не роняет приложение', () => {
    const store = createLocalStorageStore(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(store.read().ok).toBe(false);
    expect(store.write('x').ok).toBe(false);
    expect(store.writeBackup('x', 1).ok).toBe(false);
  });

  it('writeBackup: сохраняет копию, не трогая основной ключ', () => {
    localStorage.setItem(STORAGE_KEY, 'main');
    const result = createLocalStorageStore().writeBackup('broken', 111);
    expect(result).toStrictEqual({ ok: true, value: `${BACKUP_PREFIX}111` });
    expect(localStorage.getItem(`${BACKUP_PREFIX}111`)).toBe('broken');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('main');
  });

  it('writeBackup: два копирования в одну миллисекунду не затирают друг друга', () => {
    const store = createLocalStorageStore();
    store.writeBackup('first', 5);
    store.writeBackup('second', 5);
    expect(backupKeys()).toHaveLength(2);
  });

  it(`writeBackup: хранит не более ${MAX_BACKUPS} последних копий, удаляя самые старые`, () => {
    const store = createLocalStorageStore();
    for (const timestamp of [10, 20, 30, 40, 50]) store.writeBackup(`data${timestamp}`, timestamp);

    expect(backupKeys().sort()).toStrictEqual(
      [`${BACKUP_PREFIX}30`, `${BACKUP_PREFIX}40`, `${BACKUP_PREFIX}50`].sort(),
    );
  });

  it('копии не мешают основному состоянию и чужим ключам', () => {
    localStorage.setItem('other_app_key', 'keep');
    const store = createLocalStorageStore();
    for (const timestamp of [1, 2, 3, 4]) store.writeBackup('x', timestamp);
    expect(localStorage.getItem('other_app_key')).toBe('keep');
  });
});

import { describe, expect, it } from 'vitest';
import { isRecord, migrateState, type MigrationRegistry } from './migrations';

const addArchived: MigrationRegistry = {
  1: (data) => ({
    ...data,
    tasks: Array.isArray(data['tasks'])
      ? data['tasks'].map((task: Record<string, unknown>) => ({ ...task, archived: false }))
      : [],
  }),
};

describe('migrateState', () => {
  it('данные без schemaVersion считаются версией 1', () => {
    const result = migrateState({ tags: [], tasks: [] });
    expect(result).toStrictEqual({ ok: true, value: { tags: [], tasks: [], schemaVersion: 1 } });
  });

  it('сохраняет неизвестные поля (их судьба решается схемой, а не мигратором)', () => {
    const result = migrateState({ schemaVersion: 1, tasks: [], extra: 'x' });
    expect(result.ok && isRecord(result.value) && result.value['extra']).toBe('x');
  });

  it('последовательно применяет шаги реестра v1 -> v2', () => {
    const result = migrateState({ schemaVersion: 1, tasks: [{ id: 'a' }] }, 2, addArchived);
    expect(result).toStrictEqual({
      ok: true,
      value: { schemaVersion: 2, tasks: [{ id: 'a', archived: false }] },
    });
  });

  it('отклоняет данные более новой версии, а не портит их', () => {
    const result = migrateState({ schemaVersion: 5 });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain('более новой версией');
  });

  it('сообщает об отсутствующем шаге миграции', () => {
    const result = migrateState({ schemaVersion: 1 }, 3, {});
    expect(!result.ok && result.error).toContain('Нет миграции с версии 1');
  });

  it('превращает исключение в шаге в ошибку, а не в падение приложения', () => {
    const broken: MigrationRegistry = {
      1: () => {
        throw new Error('boom');
      },
    };
    const result = migrateState({ schemaVersion: 1 }, 2, broken);
    expect(!result.ok && result.error).toContain('boom');
  });

  it.each([null, undefined, 42, 'text', [], true])('отклоняет не-объект: %j', (raw) => {
    expect(migrateState(raw).ok).toBe(false);
  });

  it.each([0, -1, 1.5, '1', null])('отклоняет некорректный schemaVersion: %j', (version) => {
    expect(migrateState({ schemaVersion: version }).ok).toBe(false);
  });
});

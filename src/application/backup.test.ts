import { describe, expect, it } from 'vitest';
import { makeState, makeTag, makeTask, uuid } from '../domain/fixtures';
import { createBackupFile, parseBackup, planImport } from './backup';
import { createFixedClock, createMemoryStore } from './fakes';

const clock = createFixedClock(Date.UTC(2026, 10, 10, 12, 0, 0));

describe('экспорт и импорт', () => {
  it('round-trip: экспорт -> импорт даёт идентичное состояние', () => {
    const original = makeState({
      tags: [makeTag(1, { name: 'Работа' })],
      tasks: [makeTask(10, { tagId: uuid(1), priority: 'high', completed: true })],
    });
    const file = createBackupFile(original, clock.now());
    const imported = parseBackup(file.content);
    expect(imported).toStrictEqual({ ok: true, value: original });
    expect(file.filename).toBe('vibeapp-backup-2026-11-10.json');
  });

  it.each([
    ['не JSON', 'hello', 'JSON'],
    ['не объект', '[1,2]', 'объект'],
    ['будущая схема', '{"schemaVersion":7}', 'более новой'],
    ['мусор в полях', '{"schemaVersion":1,"tasks":[{"id":1}]}', 'формат'],
    ['дубликаты ID', JSON.stringify(makeState({ tags: [makeTag(1), makeTag(1)] })), 'Повторяющийся'],
    [
      'висячий тег',
      JSON.stringify(makeState({ tasks: [makeTask(1, { tagId: uuid(5) })] })),
      'несуществующий',
    ],
  ])('отклоняет: %s', (_name, raw, fragment) => {
    const result = parseBackup(raw);
    expect(!result.ok && result.error).toContain(fragment);
  });

  it('отклоняет файл больше лимита по размеру (считаются байты, а не символы)', () => {
    const result = parseBackup('я'.repeat(600), 1000);
    expect(!result.ok && result.error).toContain('МБ');
  });
});

describe('planImport', () => {
  const current = makeState({ tasks: [makeTask(1, { title: 'моя' })] });
  const incoming = makeState({ tasks: [makeTask(2, { title: 'чужая' })] });

  it('replace: делает копию текущих данных и возвращает импортируемое состояние', () => {
    const store = createMemoryStore();
    const result = planImport({ store, clock }, current, incoming, 'replace');
    expect(result.ok && result.value.state).toStrictEqual(incoming);
    expect([...store.backups.values()]).toStrictEqual([JSON.stringify(current)]);
  });

  it('merge: объединяет данные', () => {
    const result = planImport({ store: createMemoryStore(), clock }, current, incoming, 'merge');
    expect(result.ok && result.value.state.tasks.map((t) => t.title)).toStrictEqual(['моя', 'чужая']);
  });

  it('без копии текущих данных импорт не выполняется', () => {
    const store = createMemoryStore({ failBackup: true });
    const result = planImport({ store, clock }, current, incoming, 'replace');
    expect(!result.ok && result.error).toContain('Импорт отменён');
  });

  it('конфликт при merge не оставляет копий и не применяется', () => {
    const store = createMemoryStore();
    const broken = makeState({ tasks: [makeTask(3, { tagId: uuid(77) })] });
    expect(planImport({ store, clock }, current, broken, 'merge').ok).toBe(false);
    expect(store.backups.size).toBe(0);
  });
});

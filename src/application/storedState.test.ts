import { describe, expect, it } from 'vitest';
import { makeState, makeTag, makeTask, uuid } from '../domain/fixtures';
import { createFixedClock, createMemoryStore } from './fakes';
import { loadState, saveState } from './storedState';

const clock = createFixedClock(5000);

describe('loadState', () => {
  it('пустое хранилище -> fresh, сохранение разрешено', () => {
    const report = loadState(createMemoryStore(), clock);
    expect(report).toMatchObject({ kind: 'fresh', saveAllowed: true });
  });

  it('корректные данные -> loaded', () => {
    const state = makeState({ tasks: [makeTask(1)] });
    const report = loadState(createMemoryStore({ initial: JSON.stringify(state) }), clock);
    expect(report).toMatchObject({ kind: 'loaded', state });
  });

  it('старый формат без schemaVersion и с пропущенными полями проходит через миграцию и дефолты', () => {
    const legacy = JSON.stringify({ tasks: [{ id: uuid(1), title: 'x', createdAt: 1, updatedAt: 1 }] });
    const report = loadState(createMemoryStore({ initial: legacy }), clock);
    expect(report.kind).toBe('loaded');
    expect(report.state.tasks[0]).toMatchObject({ priority: 'medium', completed: false });
  });

  it.each([
    ['битый JSON', '{not json'],
    ['неверный тип', JSON.stringify({ schemaVersion: 1, tasks: 'oops' })],
    ['висячая ссылка', JSON.stringify(makeState({ tasks: [makeTask(1, { tagId: uuid(9) })] }))],
    ['схема из будущего', JSON.stringify({ schemaVersion: 9, tags: [], tasks: [] })],
  ])('%s -> recovered: копия сохранена, исходник не потерян', (_name, raw) => {
    const store = createMemoryStore({ initial: raw });
    const report = loadState(store, clock);

    expect(report.kind).toBe('recovered');
    expect(report.saveAllowed).toBe(true);
    expect(report.state.tasks).toHaveLength(0);
    expect([...store.backups.values()]).toStrictEqual([raw]);
    expect(store.value).toBe(raw);
  });

  it('если копию сделать не удалось — запись блокируется, чтобы не затереть данные', () => {
    const store = createMemoryStore({ initial: '{broken', failBackup: true });
    const report = loadState(store, clock);
    expect(report).toMatchObject({ kind: 'recovered', saveAllowed: false, backupKey: null });
  });

  it('хранилище недоступно -> unreadable, запись заблокирована', () => {
    const report = loadState(createMemoryStore({ failRead: true }), clock);
    expect(report).toMatchObject({ kind: 'unreadable', saveAllowed: false });
  });
});

describe('saveState', () => {
  it('записывает состояние как JSON', () => {
    const store = createMemoryStore();
    const state = makeState({ tags: [makeTag(1)] });
    expect(saveState(store, state).ok).toBe(true);
    expect(JSON.parse(store.value ?? 'null')).toStrictEqual(state);
  });

  it('ошибка квоты возвращается как err, а не как исключение', () => {
    const result = saveState(createMemoryStore({ failWrite: true }), makeState());
    expect(result).toStrictEqual({ ok: false, error: 'QuotaExceededError' });
  });
});

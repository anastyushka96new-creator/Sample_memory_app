import { describe, expect, it } from 'vitest';
import { makeState, makeTask, uuid } from './fixtures';
import { AppStateSchema, TaskSchema, createEmptyState } from './schema';

describe('AppStateSchema', () => {
  it('принимает корректное состояние без изменений', () => {
    const state = makeState({ tasks: [makeTask(1)] });
    expect(AppStateSchema.parse(state)).toStrictEqual(state);
  });

  it('подставляет значения по умолчанию для необязательных полей задачи', () => {
    const parsed = TaskSchema.parse({ id: uuid(1), title: 'a', createdAt: 1, updatedAt: 1 });
    expect(parsed.priority).toBe('medium');
    expect(parsed.completed).toBe(false);
    expect(parsed.tagId).toBeNull();
  });

  it('отклоняет не-UUID идентификаторы', () => {
    expect(TaskSchema.safeParse({ ...makeTask(1), id: 'abc' }).success).toBe(false);
    expect(TaskSchema.safeParse({ ...makeTask(1), id: '1731234567890' }).success).toBe(false);
  });

  it('отклоняет пустой заголовок, состоящий из пробелов', () => {
    expect(TaskSchema.safeParse({ ...makeTask(1), title: '   ' }).success).toBe(false);
  });

  it('отклоняет чужую версию схемы', () => {
    expect(AppStateSchema.safeParse({ ...createEmptyState(), schemaVersion: 2 }).success).toBe(false);
  });

  it('createEmptyState каждый раз возвращает новый объект', () => {
    expect(createEmptyState()).not.toBe(createEmptyState());
  });
});

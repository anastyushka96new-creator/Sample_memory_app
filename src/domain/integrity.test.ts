import { describe, expect, it } from 'vitest';
import { makeState, makeTag, makeTask, uuid } from './fixtures';
import { checkIntegrity } from './integrity';
import { LIMITS } from './schema';

describe('checkIntegrity', () => {
  it('принимает связное состояние', () => {
    const state = makeState({ tags: [makeTag(1)], tasks: [makeTask(10, { tagId: uuid(1) })] });
    expect(checkIntegrity(state).ok).toBe(true);
  });

  it('находит дубликат ID тега', () => {
    const result = checkIntegrity(makeState({ tags: [makeTag(1), makeTag(1)] }));
    expect(!result.ok && result.error).toContain('ID тега');
  });

  it('находит дубликат ID задачи', () => {
    const result = checkIntegrity(makeState({ tasks: [makeTask(1), makeTask(1)] }));
    expect(!result.ok && result.error).toContain('ID задачи');
  });

  it('находит «висячую» ссылку на тег', () => {
    const result = checkIntegrity(makeState({ tasks: [makeTask(1, { tagId: uuid(99) })] }));
    expect(!result.ok && result.error).toContain('несуществующий тег');
  });

  it('проверяет лимит количества задач', () => {
    const tasks = Array.from({ length: LIMITS.maxTasks + 1 }, (_, i) => makeTask(i + 1));
    expect(checkIntegrity(makeState({ tasks })).ok).toBe(false);
  });
});

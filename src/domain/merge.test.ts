import { describe, expect, it } from 'vitest';
import { makeState, makeTag, makeTask, uuid } from './fixtures';
import { mergeStates } from './merge';

describe('mergeStates', () => {
  it('добавляет новые теги и задачи, не дублируя существующие', () => {
    const current = makeState({ tags: [makeTag(1)], tasks: [makeTask(10)] });
    const incoming = makeState({
      tags: [makeTag(1), makeTag(2)],
      tasks: [makeTask(10), makeTask(11, { tagId: uuid(2) })],
    });
    const result = mergeStates(current, incoming);
    expect(result.ok && result.value.tags).toHaveLength(2);
    expect(result.ok && result.value.tasks).toHaveLength(2);
  });

  it('при конфликте ID побеждает более свежая задача', () => {
    const current = makeState({ tasks: [makeTask(10, { title: 'старая', updatedAt: 1000 })] });
    const incoming = makeState({ tasks: [makeTask(10, { title: 'новая', updatedAt: 2000 })] });
    const result = mergeStates(current, incoming);
    expect(result.ok && result.value.tasks[0]?.title).toBe('новая');
  });

  it('при равном updatedAt остаётся текущая версия', () => {
    const current = makeState({ tasks: [makeTask(10, { title: 'моя' })] });
    const incoming = makeState({ tasks: [makeTask(10, { title: 'чужая' })] });
    const result = mergeStates(current, incoming);
    expect(result.ok && result.value.tasks[0]?.title).toBe('моя');
  });

  it('не создаёт «висячих» ссылок', () => {
    const current = makeState();
    const incoming = makeState({ tasks: [makeTask(10, { tagId: uuid(99) })] });
    expect(mergeStates(current, incoming).ok).toBe(false);
  });
});

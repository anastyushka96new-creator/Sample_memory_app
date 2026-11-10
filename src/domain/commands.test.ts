import { describe, expect, it } from 'vitest';
import { makeState, makeTag, makeTask, uuid } from './fixtures';
import { createTag, deleteTagCascade } from './tagCommands';
import { createTask, deleteTask, toggleTask } from './taskCommands';

describe('tagCommands', () => {
  it('создаёт тег и не мутирует исходное состояние', () => {
    const state = makeState();
    const result = createTag(state, '  Работа ', '#112233', uuid(1));
    expect(result.ok && result.value.tags).toStrictEqual([
      { id: uuid(1), name: 'Работа', color: '#112233' },
    ]);
    expect(state.tags).toHaveLength(0);
  });

  it('запрещает дубликаты имён без учёта регистра и ё/е', () => {
    const state = makeState({ tags: [makeTag(1, { name: 'Ёлка' })] });
    expect(createTag(state, 'елка', '#000', uuid(2)).ok).toBe(false);
  });

  it('отклоняет пустое имя', () => {
    expect(createTag(makeState(), '   ', '#000', uuid(1)).ok).toBe(false);
  });

  it('каскадно обнуляет tagId у задач и обновляет updatedAt только у затронутых', () => {
    const state = makeState({
      tags: [makeTag(1), makeTag(2)],
      tasks: [makeTask(10, { tagId: uuid(1) }), makeTask(11, { tagId: uuid(2) })],
    });
    const result = deleteTagCascade(state, uuid(1), 2000);
    expect(result.ok && result.value.tags.map((t) => t.id)).toStrictEqual([uuid(2)]);
    expect(result.ok && result.value.tasks[0]).toMatchObject({ tagId: null, updatedAt: 2000 });
    expect(result.ok && result.value.tasks[1]).toMatchObject({ tagId: uuid(2), updatedAt: 1000 });
  });

  it('сообщает об удалении несуществующего тега', () => {
    expect(deleteTagCascade(makeState(), uuid(1), 1).ok).toBe(false);
  });
});

describe('taskCommands', () => {
  const input = { title: ' Купить хлеб ', priority: 'high', tagId: null } as const;

  it('создаёт задачу с переданными id и временем, добавляя её в начало списка', () => {
    const state = makeState({ tasks: [makeTask(1)] });
    const result = createTask(state, input, uuid(2), 5000);
    expect(result.ok && result.value.tasks[0]).toStrictEqual({
      id: uuid(2),
      title: 'Купить хлеб',
      completed: false,
      priority: 'high',
      tagId: null,
      createdAt: 5000,
      updatedAt: 5000,
    });
  });

  it('не создаёт задачу с несуществующим тегом', () => {
    expect(createTask(makeState(), { ...input, tagId: uuid(7) }, uuid(2), 1).ok).toBe(false);
  });

  it('не создаёт задачу с пустым заголовком', () => {
    expect(createTask(makeState(), { ...input, title: '  ' }, uuid(2), 1).ok).toBe(false);
  });

  it('переключает выполнение и обновляет updatedAt', () => {
    const result = toggleTask(makeState({ tasks: [makeTask(1)] }), uuid(1), 9000);
    expect(result.ok && result.value.tasks[0]).toMatchObject({ completed: true, updatedAt: 9000 });
  });

  it('удаляет задачу и сообщает, если её нет', () => {
    const state = makeState({ tasks: [makeTask(1)] });
    const removed = deleteTask(state, uuid(1));
    expect(removed.ok && removed.value.tasks).toHaveLength(0);
    expect(deleteTask(state, uuid(2)).ok).toBe(false);
  });
});

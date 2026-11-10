import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTER, normalizeFilter, selectVisibleTasks } from './filter';
import { makeTag, makeTask, uuid } from './fixtures';
import { isSearchMatch, normalizeText } from './search';
import { calculatePercentage, getCompletionStats } from './stats';

describe('поиск', () => {
  it('«й» не превращается в «и»', () => {
    expect(isSearchMatch('Йогурт', 'иогурт')).toBe(false);
    expect(isSearchMatch('Йогурт', 'йог')).toBe(true);
  });

  it('разные формы записи «й» (NFC и NFD) считаются одинаковыми', () => {
    const decomposed = 'йогурт'; // "и" + комбинируемая краткая
    expect(normalizeText(decomposed)).toBe(normalizeText('йогурт'));
    expect(isSearchMatch(decomposed, 'ЙОГ')).toBe(true);
  });

  it('«ё» и «е» эквивалентны, регистр и лишние пробелы не важны', () => {
    expect(isSearchMatch('Всё  готово', 'все ГОТОВО')).toBe(true);
  });

  it('пустой запрос подходит всему', () => {
    expect(isSearchMatch('что угодно', '   ')).toBe(true);
  });

  it('спецсимволы регулярных выражений трактуются буквально', () => {
    expect(isSearchMatch('цена (100)', '(100)')).toBe(true);
    expect(isSearchMatch('abc', '.*')).toBe(false);
  });
});

describe('фильтры', () => {
  const tasks = [
    makeTask(1, { title: 'Хлеб', completed: true, tagId: uuid(50) }),
    makeTask(2, { title: 'Молоко', completed: false, tagId: null }),
  ];

  it('без условий возвращает всё', () => {
    expect(selectVisibleTasks(tasks, DEFAULT_FILTER)).toHaveLength(2);
  });

  it('комбинирует статус, тег и поиск', () => {
    const filter = { status: 'done', tag: { kind: 'tag', id: uuid(50) }, query: 'хл' } as const;
    expect(selectVisibleTasks(tasks, filter).map((t) => t.id)).toStrictEqual([uuid(1)]);
  });

  it('фильтр «без тега»', () => {
    const result = selectVisibleTasks(tasks, { ...DEFAULT_FILTER, tag: { kind: 'none' } });
    expect(result.map((t) => t.id)).toStrictEqual([uuid(2)]);
  });

  it('фильтр по удалённому тегу сбрасывается в «любой тег»', () => {
    const filter = { ...DEFAULT_FILTER, tag: { kind: 'tag', id: uuid(50) } } as const;
    expect(normalizeFilter(filter, [makeTag(1)]).tag).toStrictEqual({ kind: 'any' });
    expect(normalizeFilter(filter, [makeTag(50)])).toBe(filter);
  });
});

describe('статистика', () => {
  it.each([
    [0, 0, 0],
    [5, 0, 0],
    [-1, 10, 0],
    [1, 3, 33],
    [10, 5, 100],
    [Number.NaN, 5, 0],
    [1, Number.POSITIVE_INFINITY, 0],
  ])('calculatePercentage(%j, %j) = %j', (part, total, expected) => {
    expect(calculatePercentage(part, total)).toBe(expected);
  });

  it('считает прогресс по задачам', () => {
    const stats = getCompletionStats([makeTask(1, { completed: true }), makeTask(2)]);
    expect(stats).toStrictEqual({ total: 2, done: 1, percent: 50 });
  });
});

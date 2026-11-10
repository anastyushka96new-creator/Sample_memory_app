import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { makeState, makeTag, makeTask, uuid } from '../domain/fixtures';
import { renderApp } from './testHarness';

afterEach(cleanup);

async function addTask(harness: ReturnType<typeof renderApp>, title: string): Promise<void> {
  await harness.user.type(screen.getByLabelText('Новая задача'), title);
  await harness.user.click(screen.getByRole('button', { name: 'Добавить' }));
}

describe('задачи', () => {
  it('добавляет задачу, показывает её и обновляет прогресс', async () => {
    const harness = renderApp();
    await addTask(harness, 'Купить хлеб');

    expect(screen.getByText('Купить хлеб')).toBeTruthy();
    expect(screen.getByLabelText('Прогресс').textContent).toContain('Выполнено 0 из 1 (0%)');

    await harness.user.click(screen.getByRole('checkbox'));
    expect(screen.getByLabelText('Прогресс').textContent).toContain('Выполнено 1 из 1 (100%)');
  });

  it('пустой заголовок не создаёт задачу и показывает ошибку', async () => {
    const harness = renderApp();
    await addTask(harness, '   ');
    expect(screen.getByRole('alert').textContent).toContain('пустым');
    expect(screen.getByText('Задач нет')).toBeTruthy();
  });

  it('удаляет задачу', async () => {
    const harness = renderApp();
    await addTask(harness, 'Временная');
    await harness.user.click(screen.getByRole('button', { name: /Удалить «Временная»/ }));
    expect(screen.getByText('Задач нет')).toBeTruthy();
  });

  it('поиск находит «Йогурт» по «йог» и не находит по «иог»', async () => {
    const initial = JSON.stringify(makeState({ tasks: [makeTask(1, { title: 'Йогурт' })] }));
    const harness = renderApp({ initial });
    const search = screen.getByLabelText('Поиск');

    await harness.user.type(search, 'иог');
    expect(screen.getByText('Задач нет')).toBeTruthy();
    await harness.user.clear(search);
    await harness.user.type(search, 'йог');
    expect(screen.getByText('Йогурт')).toBeTruthy();
  });
});

describe('теги', () => {
  it('удаление тега очищает его у задач, а фильтр по нему сбрасывается', async () => {
    const initial = JSON.stringify(
      makeState({
        tags: [makeTag(1, { name: 'Дом' })],
        tasks: [makeTask(10, { title: 'Пропылесосить', tagId: uuid(1) })],
      }),
    );
    const harness = renderApp({ initial });
    const tasks = screen.getByRole('list', { name: 'Список задач' });
    const tags = screen.getByRole('list', { name: 'Список тегов' });
    expect(within(tasks).getByText('Дом')).toBeTruthy();

    const tagFilter = screen.getByLabelText<HTMLSelectElement>('Фильтр по тегу');
    await harness.user.selectOptions(tagFilter, uuid(1));
    expect(tagFilter.value).toBe(uuid(1));

    // Удаление тега требует подтверждения вторым нажатием.
    await harness.user.click(within(tags).getByRole('button'));
    await harness.user.click(within(tags).getByRole('button', { name: 'Удалить?' }));

    expect(within(screen.getByRole('list', { name: 'Список задач' })).getByText('Пропылесосить')).toBeTruthy();
    expect(screen.queryByText('Дом')).toBeNull();
    expect(screen.getByLabelText<HTMLSelectElement>('Фильтр по тегу').value).toBe('any');
  });

  it('не создаёт тег-дубликат', async () => {
    const harness = renderApp();
    for (let attempt = 0; attempt < 2; attempt++) {
      await harness.user.type(screen.getByLabelText('Название тега'), 'Работа');
      await harness.user.click(screen.getByRole('button', { name: 'Создать тег' }));
    }
    expect(screen.getByRole('alert').textContent).toContain('уже есть');
  });
});

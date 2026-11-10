import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBackupFile } from '../application/backup';
import { makeState, makeTask } from '../domain/fixtures';
import { SAVE_DELAY_MS } from './usePersistentState';
import { renderApp } from './testHarness';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function addTask(harness: ReturnType<typeof renderApp>, title: string): Promise<void> {
  await harness.user.type(screen.getByLabelText('Новая задача'), title);
  await harness.user.click(screen.getByRole('button', { name: 'Добавить' }));
}

describe('сохранение', () => {
  it('записывает в хранилище только после паузы (debounce), одной записью', async () => {
    const harness = renderApp();
    await addTask(harness, 'Первая');
    await addTask(harness, 'Вторая');
    expect(harness.store.writes).toBe(0);

    act(() => {
      vi.advanceTimersByTime(SAVE_DELAY_MS + 1);
    });
    expect(harness.store.writes).toBe(1);
    expect(harness.store.value).toContain('Вторая');
  });

  it('сворачивание приложения немедленно сбрасывает отложенную запись', async () => {
    const harness = renderApp();
    await addTask(harness, 'Не потерять');
    expect(harness.store.writes).toBe(0);

    act(() => {
      harness.goBackground();
    });
    expect(harness.store.writes).toBe(1);
    expect(harness.store.value).toContain('Не потерять');
  });

  it('размонтирование тоже сбрасывает запись, и повторного сохранения нет', async () => {
    const harness = renderApp();
    await addTask(harness, 'Закрытие');
    harness.unmount();
    expect(harness.store.writes).toBe(1);
    act(() => {
      vi.advanceTimersByTime(SAVE_DELAY_MS * 3);
    });
    expect(harness.store.writes).toBe(1);
  });

  it('ошибка квоты показывается пользователю и данные остаются в интерфейсе', async () => {
    const harness = renderApp({ failWrite: true });
    await addTask(harness, 'Большая');
    act(() => {
      vi.advanceTimersByTime(SAVE_DELAY_MS + 1);
    });
    expect(screen.getByRole('alert').textContent).toContain('Не удалось сохранить');
    expect(screen.getByText('Большая')).toBeTruthy();
  });
});

describe('повреждённые данные', () => {
  it('битый JSON: копия сохранена, баннер показан, исходник не затёрт', () => {
    const harness = renderApp({ initial: '{broken' });
    expect(screen.getByRole('status').textContent).toContain('Копия сохранена');
    expect([...harness.store.backups.values()]).toStrictEqual(['{broken']);
    expect(harness.store.value).toBe('{broken');
  });

  it('копию сделать нельзя: сохранение блокируется и исходник остаётся нетронутым', async () => {
    const harness = renderApp({ initial: '{broken', failBackup: true });
    expect(screen.getByRole('alert').textContent).toContain('Сохранение отключено');

    await addTask(harness, 'Опасно');
    act(() => {
      harness.goBackground();
      vi.advanceTimersByTime(SAVE_DELAY_MS * 2);
    });
    expect(harness.store.writes).toBe(0);
    expect(harness.store.value).toBe('{broken');
  });

  it('пользователь может осознанно разблокировать сохранение двойным подтверждением', async () => {
    const harness = renderApp({ initial: '{broken', failBackup: true });
    const start = screen.getByRole('button', { name: 'Начать с чистого листа' });
    await harness.user.click(start);
    await harness.user.click(screen.getByRole('button', { name: 'Да, стереть старые данные' }));

    await addTask(harness, 'Новая жизнь');
    act(() => {
      harness.goBackground();
    });
    expect(harness.store.value).toContain('Новая жизнь');
  });

  it('недоступное хранилище: предупреждение и никаких записей', () => {
    const harness = renderApp({ failRead: true });
    expect(screen.getByRole('alert').textContent).toContain('Хранилище недоступно');
    expect(harness.store.writes).toBe(0);
  });
});

describe('экспорт и импорт', () => {
  it('экспорт передаёт в exporter корректный файл текущего состояния', async () => {
    const state = makeState({ tasks: [makeTask(1, { title: 'Экспортируемая' })] });
    const harness = renderApp({ initial: JSON.stringify(state) });
    await harness.user.click(screen.getByRole('button', { name: 'Экспорт' }));

    expect(harness.exported).toHaveLength(1);
    expect(harness.exported[0]?.content).toBe(createBackupFile(state, 1_700_000_000_000).content);
    expect(screen.getByRole('status').textContent).toContain('Файл сохранён');
  });

  it('импорт «Заменить всё» сначала делает копию текущих данных', async () => {
    const current = makeState({ tasks: [makeTask(1, { title: 'Старая' })] });
    const incoming = makeState({ tasks: [makeTask(2, { title: 'Из файла' })] });
    const harness = renderApp({ initial: JSON.stringify(current) });

    const file = new File([JSON.stringify(incoming)], 'b.json', { type: 'application/json' });
    await harness.user.upload(screen.getByLabelText('Импорт из файла'), file);
    await harness.user.click(await screen.findByRole('button', { name: 'Заменить всё' }));

    expect(screen.getByText('Из файла')).toBeTruthy();
    expect(screen.queryByText('Старая')).toBeNull();
    expect([...harness.store.backups.values()]).toStrictEqual([JSON.stringify(current)]);
    expect(harness.store.value).toContain('Из файла');
  });

  it('импорт «Объединить» сохраняет обе задачи', async () => {
    const current = makeState({ tasks: [makeTask(1, { title: 'Старая' })] });
    const incoming = makeState({ tasks: [makeTask(2, { title: 'Из файла' })] });
    const harness = renderApp({ initial: JSON.stringify(current) });

    const file = new File([JSON.stringify(incoming)], 'b.json', { type: 'application/json' });
    await harness.user.upload(screen.getByLabelText('Импорт из файла'), file);
    await harness.user.click(await screen.findByRole('button', { name: 'Объединить' }));

    expect(screen.getByText('Старая')).toBeTruthy();
    expect(screen.getByText('Из файла')).toBeTruthy();
  });

  it('испорченный файл отклоняется с понятной причиной, данные не меняются', async () => {
    const harness = renderApp();
    const file = new File(['{"schemaVersion":1,"tasks":[{"id":1}]}'], 'x.json', { type: 'application/json' });
    await harness.user.upload(screen.getByLabelText('Импорт из файла'), file);

    expect((await screen.findByRole('status')).textContent).toContain('Файл не принят');
    expect(harness.store.backups.size).toBe(0);
  });
});

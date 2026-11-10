import { describe, expect, it, vi } from 'vitest';
import { capacitorLifecycle } from './appLifecycle';

type Listener = (state: { isActive: boolean }) => void;

const mocks = vi.hoisted(() => ({ addListener: vi.fn() }));
vi.mock('@capacitor/app', () => ({ App: { addListener: mocks.addListener } }));

function setupListener(): { emit: Listener; remove: ReturnType<typeof vi.fn> } {
  const remove = vi.fn().mockResolvedValue(undefined);
  let emit: Listener = () => undefined;
  mocks.addListener.mockImplementation((_event: string, listener: Listener) => {
    emit = listener;
    return Promise.resolve({ remove });
  });
  return {
    emit: (state) => {
      emit(state);
    },
    remove,
  };
}

describe('capacitorLifecycle.onBackground', () => {
  it('вызывает callback только при уходе в фон', () => {
    const { emit } = setupListener();
    const callback = vi.fn();
    capacitorLifecycle.onBackground(callback);

    emit({ isActive: true });
    expect(callback).not.toHaveBeenCalled();
    emit({ isActive: false });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('после отписки callback больше не вызывается и подписка снимается', async () => {
    const { emit, remove } = setupListener();
    const callback = vi.fn();
    const unsubscribe = capacitorLifecycle.onBackground(callback);

    unsubscribe();
    emit({ isActive: false });
    await vi.waitFor(() => {
      expect(remove).toHaveBeenCalledTimes(1);
    });
    expect(callback).not.toHaveBeenCalled();
  });
});

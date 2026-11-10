import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createFixedClock,
  createMemoryStore,
  createSequentialIds,
  type MemoryStoreOptions,
} from '../application/fakes';
import type { AppServices, BackupFile } from '../application/ports';
import { loadState } from '../application/storedState';
import { ok } from '../domain/result';
import { App } from './App';
import { StorageProvider } from './StorageProvider';

export interface Harness {
  readonly store: ReturnType<typeof createMemoryStore>;
  readonly exported: BackupFile[];
  readonly goBackground: () => void;
  readonly user: ReturnType<typeof userEvent.setup>;
  readonly unmount: () => void;
}

/** Монтирует приложение целиком с хранилищем в памяти, как это делает src/app/main.tsx. */
export function renderApp(options: MemoryStoreOptions = {}): Harness {
  const store = createMemoryStore(options);
  const clock = createFixedClock(1_700_000_000_000);
  const exported: BackupFile[] = [];
  const background = new Set<() => void>();

  const services: AppServices = {
    store,
    clock,
    ids: createSequentialIds(),
    lifecycle: {
      onBackground: (callback) => {
        background.add(callback);
        return () => {
          background.delete(callback);
        };
      },
    },
    exporter: {
      save: (file) => {
        exported.push(file);
        return ok(undefined);
      },
    },
  };

  const initial = loadState(store, clock);
  const view = render(
    <StorageProvider services={services} initial={initial}>
      <App />
    </StorageProvider>,
  );

  return {
    store,
    exported,
    goBackground: () => {
      background.forEach((callback) => {
        callback();
      });
    },
    user: userEvent.setup(),
    unmount: view.unmount,
  };
}

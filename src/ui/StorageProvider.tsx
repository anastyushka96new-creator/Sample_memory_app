import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { createBackupFile, planImport, type ImportMode } from '../application/backup';
import type { AppServices } from '../application/ports';
import type { LoadReport } from '../application/storedState';
import { ok, type Result } from '../domain/result';
import type { AppState } from '../domain/schema';
import { StorageContext, type StorageApi } from './storageContext';
import { usePersistentState } from './usePersistentState';

interface Props {
  readonly services: AppServices;
  readonly initial: LoadReport;
  readonly children: ReactNode;
}

export function StorageProvider({ services, initial, children }: Props) {
  const { store, clock, ids, lifecycle, exporter } = services;
  const persistent = usePersistentState(store, initial);
  const { state, replace, flush } = persistent;

  // Сохраняем немедленно, когда страница скрывается, закрывается или приложение уходит в фон.
  useEffect(() => {
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    const unsubscribe = lifecycle.onBackground(flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      unsubscribe();
      flush();
    };
  }, [flush, lifecycle]);

  const importBackup = useCallback(
    (incoming: AppState, mode: ImportMode): Result<void> => {
      const plan = planImport({ store, clock }, state, incoming, mode);
      if (!plan.ok) return plan;
      replace(plan.value.state);
      flush();
      return ok(undefined);
    },
    [store, clock, state, replace, flush],
  );

  const exportBackup = useCallback(
    (): Result<void> => exporter.save(createBackupFile(state, clock.now())),
    [exporter, clock, state],
  );

  const api = useMemo<StorageApi>(
    () => ({
      state,
      report: initial,
      saveError: persistent.saveError,
      persistenceBlocked: persistent.persistenceBlocked,
      ids,
      clock,
      apply: persistent.apply,
      importBackup,
      exportBackup,
      unblock: persistent.unblock,
    }),
    [state, initial, persistent, ids, clock, importBackup, exportBackup],
  );

  return <StorageContext.Provider value={api}>{children}</StorageContext.Provider>;
}

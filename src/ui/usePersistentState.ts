import { useCallback, useRef, useState } from 'react';
import { saveState, type LoadReport } from '../application/storedState';
import type { RawStore } from '../application/ports';
import { ok, type Result } from '../domain/result';
import type { AppState } from '../domain/schema';

export const SAVE_DELAY_MS = 400;

export type Command = (state: AppState) => Result<AppState>;

export interface PersistentState {
  readonly state: AppState;
  readonly saveError: string | null;
  readonly persistenceBlocked: boolean;
  apply: (command: Command) => Result<void>;
  replace: (next: AppState) => void;
  flush: () => void;
  unblock: () => void;
}

/**
 * Состояние приложения + отложенная запись.
 * Источник истины для записи — stateRef: он всегда содержит самое свежее состояние,
 * поэтому flush() на сворачивании не может сохранить устаревшие данные.
 */
export function usePersistentState(store: RawStore, initial: LoadReport): PersistentState {
  const [state, setState] = useState<AppState>(initial.state);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(!initial.saveAllowed);

  const stateRef = useRef(initial.state);
  const dirtyRef = useRef(false);
  const blockedRef = useRef(!initial.saveAllowed);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const persist = useCallback(() => {
    timerRef.current = undefined;
    if (!dirtyRef.current || blockedRef.current) return;
    const result = saveState(store, stateRef.current);
    if (result.ok) {
      dirtyRef.current = false;
      setSaveError(null);
    } else {
      setSaveError(result.error);
    }
  }, [store]);

  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
    persist();
  }, [persist]);

  const replace = useCallback(
    (next: AppState) => {
      stateRef.current = next;
      dirtyRef.current = true;
      setState(next);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(persist, SAVE_DELAY_MS);
    },
    [persist],
  );

  const apply = useCallback(
    (command: Command): Result<void> => {
      const result = command(stateRef.current);
      if (!result.ok) return result;
      replace(result.value);
      return ok(undefined);
    },
    [replace],
  );

  const unblock = useCallback(() => {
    blockedRef.current = false;
    setBlocked(false);
  }, []);

  return { state, saveError, persistenceBlocked: blocked, apply, replace, flush, unblock };
}

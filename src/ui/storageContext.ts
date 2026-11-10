import { createContext, useContext } from 'react';
import type { ImportMode } from '../application/backup';
import type { Clock, IdGenerator } from '../application/ports';
import type { LoadReport } from '../application/storedState';
import type { Result } from '../domain/result';
import type { AppState } from '../domain/schema';
import type { Command } from './usePersistentState';

export interface StorageApi {
  readonly state: AppState;
  readonly report: LoadReport;
  readonly saveError: string | null;
  readonly persistenceBlocked: boolean;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  apply: (command: Command) => Result<void>;
  importBackup: (incoming: AppState, mode: ImportMode) => Result<void>;
  exportBackup: () => Result<void>;
  unblock: () => void;
}

export const StorageContext = createContext<StorageApi | null>(null);

export function useStorage(): StorageApi {
  const api = useContext(StorageContext);
  if (api === null) throw new Error('useStorage нужно вызывать внутри <StorageProvider>');
  return api;
}

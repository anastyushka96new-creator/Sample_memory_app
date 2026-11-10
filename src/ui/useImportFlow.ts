import { useState, type ChangeEvent } from 'react';
import { parseBackup, type ImportMode } from '../application/backup';
import type { AppState } from '../domain/schema';
import { useStorage } from './storageContext';

export interface ImportFlow {
  readonly pending: AppState | null;
  readonly message: string | null;
  readonly setMessage: (message: string | null) => void;
  readonly onFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly runImport: (mode: ImportMode) => void;
  readonly cancel: () => void;
}

/** Двухшаговый импорт: сначала проверка файла, затем осознанный выбор режима. */
export function useImportFlow(): ImportFlow {
  const { importBackup } = useStorage();
  const [pending, setPending] = useState<AppState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const input = event.target;
    const file = input.files?.[0];
    if (file === undefined) return;
    try {
      const parsed = parseBackup(await file.text());
      if (parsed.ok) {
        setPending(parsed.value);
        setMessage(null);
      } else {
        setMessage(`Файл не принят: ${parsed.error}`);
      }
    } catch {
      setMessage('Не удалось прочитать файл');
    } finally {
      input.value = '';
    }
  }

  function runImport(mode: ImportMode): void {
    if (pending === null) return;
    const result = importBackup(pending, mode);
    setMessage(result.ok ? 'Импорт выполнен' : result.error);
    setPending(null);
  }

  return { pending, message, setMessage, onFile, runImport, cancel: () => { setPending(null); } };
}

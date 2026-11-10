import type { ImportMode } from '../application/backup';
import type { AppState } from '../domain/schema';
import { useStorage } from './storageContext';
import { useImportFlow } from './useImportFlow';

interface ImportChoiceProps {
  readonly incoming: AppState;
  readonly onChoose: (mode: ImportMode) => void;
  readonly onCancel: () => void;
}

function ImportChoice({ incoming, onChoose, onCancel }: ImportChoiceProps) {
  return (
    <div className="row" role="group" aria-label="Режим импорта">
      <span>
        В файле: задач — {incoming.tasks.length}, тегов — {incoming.tags.length}.
      </span>
      <button type="button" onClick={() => { onChoose('merge'); }}>Объединить</button>
      <button type="button" onClick={() => { onChoose('replace'); }}>Заменить всё</button>
      <button type="button" onClick={onCancel}>Отмена</button>
    </div>
  );
}

export function BackupPanel() {
  const { exportBackup, persistenceBlocked } = useStorage();
  const flow = useImportFlow();

  function runExport(): void {
    const result = exportBackup();
    flow.setMessage(result.ok ? 'Файл сохранён' : `Не удалось сохранить файл: ${result.error}`);
  }

  return (
    <section aria-label="Резервная копия">
      <h2>Резервная копия</h2>
      <div className="row">
        <button type="button" onClick={runExport}>Экспорт</button>
        <label>
          Импорт из файла
          <input
            type="file"
            accept="application/json,.json"
            disabled={persistenceBlocked}
            onChange={(e) => { void flow.onFile(e); }}
          />
        </label>
      </div>
      {flow.pending !== null && (
        <ImportChoice incoming={flow.pending} onChoose={flow.runImport} onCancel={flow.cancel} />
      )}
      {flow.message !== null && <p role="status">{flow.message}</p>}
    </section>
  );
}

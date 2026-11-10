import { ConfirmButton } from './ConfirmButton';
import { useStorage } from './storageContext';

export function LoadBanner() {
  const { report, persistenceBlocked, unblock } = useStorage();

  if (report.kind === 'unreadable') {
    return (
      <p role="alert" className="error">
        Хранилище недоступно ({report.reason}). Изменения НЕ сохраняются — сделайте экспорт.
      </p>
    );
  }
  if (report.kind !== 'recovered') return null;

  if (!report.saveAllowed) {
    return (
      <div role="alert" className="error">
        <p>
          Сохранённые данные повреждены ({report.reason}), а копию сделать не удалось. Сохранение отключено,
          чтобы не потерять их.
        </p>
        {persistenceBlocked && (
          <ConfirmButton onConfirm={unblock} confirmLabel="Да, стереть старые данные">
            Начать с чистого листа
          </ConfirmButton>
        )}
      </div>
    );
  }
  return (
    <p role="status" className="warn">
      Сохранённые данные оказались повреждены ({report.reason}). Копия сохранена под ключом{' '}
      <code>{report.backupKey}</code>. Приложение запущено с чистого листа.
    </p>
  );
}

export function SaveErrorBanner() {
  const { saveError } = useStorage();
  if (saveError === null) return null;
  return (
    <p role="alert" className="error">
      Не удалось сохранить данные: {saveError}. Сделайте экспорт, пока вы не закрыли приложение.
    </p>
  );
}

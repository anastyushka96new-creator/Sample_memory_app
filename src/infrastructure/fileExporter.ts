import type { FileExporter } from '../application/ports';
import { err, ok } from '../domain/result';

/**
 * Скачивание файла в обычном браузере. В Android WebView скачивание через <a download>
 * ненадёжно: для APK нужна отдельная реализация порта FileExporter
 * (Capacitor Filesystem + Share) — см. PROGRESS.md, срез "Android-экспорт".
 */
export const browserFileExporter: FileExporter = {
  save(file) {
    try {
      const url = URL.createObjectURL(new Blob([file.content], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Не удалось выгрузить файл');
    }
  },
};

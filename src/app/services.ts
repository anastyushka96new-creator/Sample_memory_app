import type { AppServices } from '../application/ports';
import { capacitorLifecycle } from '../infrastructure/appLifecycle';
import { browserFileExporter } from '../infrastructure/fileExporter';
import { systemClock, uuidGenerator } from '../infrastructure/ids';
import { createLocalStorageStore } from '../infrastructure/localStorageStore';

/** Единственное место, где порты связываются с реализациями (composition root). */
export function createServices(): AppServices {
  return {
    store: createLocalStorageStore(),
    clock: systemClock,
    ids: uuidGenerator,
    lifecycle: capacitorLifecycle,
    exporter: browserFileExporter,
  };
}

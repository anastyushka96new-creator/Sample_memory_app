import { App } from '@capacitor/app';
import type { AppLifecycle } from '../application/ports';

/**
 * На Android срабатывает при сворачивании приложения; в браузере плагин
 * использует visibilitychange. Подписка снимается возвращаемой функцией,
 * даже если она вызвана до того, как Promise с дескриптором завершился.
 */
export const capacitorLifecycle: AppLifecycle = {
  onBackground(callback) {
    let active = true;
    const subscription = App.addListener('appStateChange', ({ isActive }) => {
      if (active && !isActive) callback();
    });
    subscription.catch((error: unknown) => {
      console.error('Не удалось подписаться на события жизненного цикла', error);
    });

    return () => {
      active = false;
      void subscription.then((handle) => handle.remove()).catch(() => undefined);
    };
  },
};

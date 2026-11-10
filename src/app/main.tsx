import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadState } from '../application/storedState';
import { App } from '../ui/App';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { StorageProvider } from '../ui/StorageProvider';
import { createServices } from './services';

const container = document.getElementById('root');
if (container === null) throw new Error('В index.html нет элемента #root');

// Загрузка выполняется ОДИН раз до React: в StrictMode инициализаторы вызываются дважды,
// а у loadState есть побочный эффект (копия повреждённых данных).
const services = createServices();
const initial = loadState(services.store, services.clock);

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <StorageProvider services={services} initial={initial}>
        <App />
      </StorageProvider>
    </ErrorBoundary>
  </StrictMode>,
);

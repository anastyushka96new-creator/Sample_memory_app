import { useState } from 'react';
import { DEFAULT_FILTER, normalizeFilter, selectVisibleTasks, type TaskFilter } from '../domain/filter';
import { getCompletionStats } from '../domain/stats';
import { BackupPanel } from './BackupPanel';
import { LoadBanner, SaveErrorBanner } from './Banners';
import { TagPanel } from './TagPanel';
import { TaskFilters } from './TaskFilters';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { useActions } from './useActions';
import { useStorage } from './storageContext';
import './styles.css';

export function App() {
  const { state } = useStorage();
  const actions = useActions();
  const [rawFilter, setFilter] = useState<TaskFilter>(DEFAULT_FILTER);

  // Всё ниже вычисляется во время рендера и нигде не дублируется в state.
  const filter = normalizeFilter(rawFilter, state.tags);
  const visible = selectVisibleTasks(state.tasks, filter);
  const stats = getCompletionStats(state.tasks);

  return (
    <main>
      <h1>Задачи</h1>
      <LoadBanner />
      <SaveErrorBanner />
      <p className="muted" aria-label="Прогресс">
        Выполнено {stats.done} из {stats.total} ({stats.percent}%)
      </p>
      <TaskForm tags={state.tags} onAdd={actions.addTask} />
      <TaskFilters filter={filter} tags={state.tags} onChange={setFilter} />
      <TaskList
        tasks={visible}
        tags={state.tags}
        onToggle={(id) => { actions.toggleTask(id); }}
        onRemove={(id) => { actions.removeTask(id); }}
      />
      <TagPanel
        tags={state.tags}
        onAdd={actions.addTag}
        onRemove={(id) => { actions.removeTag(id); }}
      />
      <BackupPanel />
    </main>
  );
}

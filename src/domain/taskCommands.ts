import { err, ok, type Result } from './result';
import { LIMITS, type AppState, type Priority } from './schema';
import { parseTitle } from './validation';

export interface NewTaskInput {
  readonly title: string;
  readonly priority: Priority;
  readonly tagId: string | null;
}

export function createTask(
  state: AppState,
  input: NewTaskInput,
  id: string,
  now: number,
): Result<AppState> {
  const title = parseTitle(input.title);
  if (!title.ok) return title;
  if (state.tasks.length >= LIMITS.maxTasks) return err(`Достигнут лимит задач (${LIMITS.maxTasks})`);
  if (input.tagId !== null && !state.tags.some((tag) => tag.id === input.tagId)) {
    return err('Выбранный тег не существует');
  }

  const task = {
    id,
    title: title.value,
    completed: false,
    priority: input.priority,
    tagId: input.tagId,
    createdAt: now,
    updatedAt: now,
  };
  return ok({ ...state, tasks: [task, ...state.tasks] });
}

export function toggleTask(state: AppState, taskId: string, now: number): Result<AppState> {
  if (!state.tasks.some((task) => task.id === taskId)) return err('Задача не найдена');
  return ok({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed, updatedAt: now } : task,
    ),
  });
}

export function deleteTask(state: AppState, taskId: string): Result<AppState> {
  if (!state.tasks.some((task) => task.id === taskId)) return err('Задача не найдена');
  return ok({ ...state, tasks: state.tasks.filter((task) => task.id !== taskId) });
}

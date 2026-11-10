import type { Tag, Task } from '../domain/schema';

interface Props {
  readonly tasks: readonly Task[];
  readonly tags: readonly Tag[];
  readonly onToggle: (id: string) => void;
  readonly onRemove: (id: string) => void;
}

const PRIORITY_LABEL = { low: 'низкий', medium: 'средний', high: 'высокий' } as const;

export function TaskList({ tasks, tags, onToggle, onRemove }: Props) {
  if (tasks.length === 0) return <p className="muted">Задач нет</p>;
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));

  return (
    <ul className="list" aria-label="Список задач">
      {tasks.map((task) => {
        const tag = task.tagId === null ? undefined : tagById.get(task.tagId);
        return (
          <li key={task.id} className={task.completed ? 'done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => { onToggle(task.id); }}
              />
              <span className="title">{task.title}</span>
            </label>
            <span className="muted">{PRIORITY_LABEL[task.priority]}</span>
            {tag !== undefined && <span className="chip" style={{ borderColor: tag.color }}>{tag.name}</span>}
            <button type="button" onClick={() => { onRemove(task.id); }} aria-label={`Удалить «${task.title}»`}>
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}

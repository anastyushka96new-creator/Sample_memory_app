import { useState, type SyntheticEvent } from 'react';
import type { Result } from '../domain/result';
import { PrioritySchema, type Priority, type Tag } from '../domain/schema';
import type { NewTaskInput } from '../domain/taskCommands';

interface Props {
  readonly tags: readonly Tag[];
  readonly onAdd: (input: NewTaskInput) => Result<void>;
}

export function TaskForm({ tags, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [tagId, setTagId] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: SyntheticEvent): void {
    event.preventDefault();
    const result = onAdd({ title, priority, tagId: tagId === '' ? null : tagId });
    if (result.ok) {
      setTitle('');
      setError(null);
    } else {
      setError(result.error);
    }
  }

  return (
    <form className="row" onSubmit={submit} aria-label="Добавление задачи">
      <label>
        Новая задача
        <input value={title} onChange={(e) => { setTitle(e.target.value); }} maxLength={200} />
      </label>
      <label>
        Приоритет
        <select
          value={priority}
          onChange={(e) => {
            const parsed = PrioritySchema.safeParse(e.target.value);
            if (parsed.success) setPriority(parsed.data);
          }}
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </label>
      <label>
        Тег
        <select value={tagId} onChange={(e) => { setTagId(e.target.value); }}>
          <option value="">Без тега</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
      </label>
      <button type="submit">Добавить</button>
      {error !== null && <p role="alert" className="error">{error}</p>}
    </form>
  );
}

import { useState, type SyntheticEvent } from 'react';
import type { Result } from '../domain/result';
import type { Tag } from '../domain/schema';
import { ConfirmButton } from './ConfirmButton';

interface Props {
  readonly tags: readonly Tag[];
  readonly onAdd: (name: string, color: string) => Result<void>;
  readonly onRemove: (id: string) => void;
}

export function TagPanel({ tags, onAdd, onRemove }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#646cff');
  const [error, setError] = useState<string | null>(null);

  function submit(event: SyntheticEvent): void {
    event.preventDefault();
    const result = onAdd(name, color);
    if (result.ok) {
      setName('');
      setError(null);
    } else {
      setError(result.error);
    }
  }

  return (
    <section aria-label="Теги">
      <h2>Теги</h2>
      <form className="row" onSubmit={submit}>
        <label>
          Название тега
          <input value={name} onChange={(e) => { setName(e.target.value); }} maxLength={100} />
        </label>
        <label>
          Цвет
          <input type="color" value={color} onChange={(e) => { setColor(e.target.value); }} />
        </label>
        <button type="submit">Создать тег</button>
        {error !== null && <p role="alert" className="error">{error}</p>}
      </form>
      <ul className="chips" aria-label="Список тегов">
        {tags.map((tag) => (
          <li key={tag.id} className="chip" style={{ borderColor: tag.color }}>
            {tag.name}
            <ConfirmButton onConfirm={() => { onRemove(tag.id); }} confirmLabel="Удалить?">
              ✕
            </ConfirmButton>
          </li>
        ))}
      </ul>
    </section>
  );
}

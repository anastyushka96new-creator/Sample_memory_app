import type { StatusFilter, TagFilter, TaskFilter } from '../domain/filter';
import type { Tag } from '../domain/schema';

interface Props {
  readonly filter: TaskFilter;
  readonly tags: readonly Tag[];
  readonly onChange: (next: TaskFilter) => void;
}

function toStatus(value: string): StatusFilter {
  return value === 'active' || value === 'done' ? value : 'all';
}

function toTagFilter(value: string): TagFilter {
  if (value === 'any') return { kind: 'any' };
  if (value === 'none') return { kind: 'none' };
  return { kind: 'tag', id: value };
}

function fromTagFilter(tag: TagFilter): string {
  return tag.kind === 'tag' ? tag.id : tag.kind;
}

export function TaskFilters({ filter, tags, onChange }: Props) {
  return (
    <div className="row" role="search">
      <label>
        Поиск
        <input
          type="search"
          value={filter.query}
          onChange={(e) => { onChange({ ...filter, query: e.target.value }); }}
        />
      </label>
      <label>
        Статус
        <select
          value={filter.status}
          onChange={(e) => { onChange({ ...filter, status: toStatus(e.target.value) }); }}
        >
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="done">Выполненные</option>
        </select>
      </label>
      <label>
        Фильтр по тегу
        <select
          value={fromTagFilter(filter.tag)}
          onChange={(e) => { onChange({ ...filter, tag: toTagFilter(e.target.value) }); }}
        >
          <option value="any">Любой</option>
          <option value="none">Без тега</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

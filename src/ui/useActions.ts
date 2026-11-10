import { useMemo } from 'react';
import type { Result } from '../domain/result';
import { createTag, deleteTagCascade } from '../domain/tagCommands';
import { createTask, deleteTask, toggleTask, type NewTaskInput } from '../domain/taskCommands';
import { useStorage } from './storageContext';

export interface Actions {
  addTask: (input: NewTaskInput) => Result<void>;
  toggleTask: (id: string) => Result<void>;
  removeTask: (id: string) => Result<void>;
  addTag: (name: string, color: string) => Result<void>;
  removeTag: (id: string) => Result<void>;
}

/** Привязывает чистые доменные команды к текущим часам и генератору ID. */
export function useActions(): Actions {
  const { apply, ids, clock } = useStorage();
  return useMemo<Actions>(
    () => ({
      addTask: (input) => apply((state) => createTask(state, input, ids.next(), clock.now())),
      toggleTask: (id) => apply((state) => toggleTask(state, id, clock.now())),
      removeTask: (id) => apply((state) => deleteTask(state, id)),
      addTag: (name, color) => apply((state) => createTag(state, name, color, ids.next())),
      removeTag: (id) => apply((state) => deleteTagCascade(state, id, clock.now())),
    }),
    [apply, ids, clock],
  );
}

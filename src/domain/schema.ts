import { z } from 'zod';

/** Версия формата данных. Меняется ТОЛЬКО вместе с добавлением шага в migrations.ts. */
export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Жёсткие лимиты: защищают localStorage (~5 МБ) и импорт от раздутых файлов. */
export const LIMITS = {
  maxTags: 200,
  maxTasks: 5000,
  maxTitleLength: 120,
  maxTagNameLength: 50,
} as const;

export const TagSchema = z.object({
  id: z.uuid('ID тега должен быть UUID'),
  name: z.string().trim().min(1, 'Название тега пустое').max(LIMITS.maxTagNameLength),
  color: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Цвет должен быть HEX, например #646cff')
    .default('#646cff'),
});

export const PrioritySchema = z.enum(['low', 'medium', 'high']);

export const TaskSchema = z.object({
  id: z.uuid('ID задачи должен быть UUID'),
  title: z.string().trim().min(1, 'Заголовок пустой').max(LIMITS.maxTitleLength),
  completed: z.boolean().default(false),
  priority: PrioritySchema.default('medium'),
  tagId: z.uuid().nullable().default(null),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const AppStateSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  tags: z.array(TagSchema).max(LIMITS.maxTags).default([]),
  tasks: z.array(TaskSchema).max(LIMITS.maxTasks).default([]),
});

// Единый источник истины: типы выводятся из схем, вручную их не дублируем.
export type Tag = z.infer<typeof TagSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type AppState = z.infer<typeof AppStateSchema>;

/** Каждый вызов возвращает НОВЫЙ объект, чтобы никто не мутировал общий "дефолт". */
export function createEmptyState(): AppState {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, tags: [], tasks: [] };
}

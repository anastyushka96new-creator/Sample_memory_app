import { checkIntegrity } from './integrity';
import { migrateState } from './migrations';
import { err, type Result } from './result';
import { AppStateSchema, type AppState } from './schema';

const MAX_REPORTED_ISSUES = 5;

/**
 * Единственная точка входа для ЛЮБЫХ внешних данных (localStorage, файл импорта):
 * миграция -> схема Zod -> проверка целостности.
 */
export function parseAppState(raw: unknown): Result<AppState> {
  const migrated = migrateState(raw);
  if (!migrated.ok) return migrated;

  const parsed = AppStateSchema.safeParse(migrated.value);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, MAX_REPORTED_ISSUES)
      .map((issue) => `${issue.path.join('.') || 'корень'}: ${issue.message}`);
    return err(`Данные не соответствуют формату: ${issues.join('; ')}`);
  }
  return checkIntegrity(parsed.data);
}

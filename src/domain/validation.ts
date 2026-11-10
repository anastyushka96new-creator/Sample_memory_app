import { err, ok, type Result } from './result';
import { LIMITS } from './schema';

export function parseTitle(raw: string): Result<string> {
  const title = raw.trim();
  if (title === '') return err('Заголовок не может быть пустым');
  if (title.length > LIMITS.maxTitleLength) {
    return err(`Заголовок длиннее ${LIMITS.maxTitleLength} символов`);
  }
  return ok(title);
}

export function parseTagName(raw: string): Result<string> {
  const name = raw.trim();
  if (name === '') return err('Название тега не может быть пустым');
  if (name.length > LIMITS.maxTagNameLength) {
    return err(`Название тега длиннее ${LIMITS.maxTagNameLength} символов`);
  }
  return ok(name);
}

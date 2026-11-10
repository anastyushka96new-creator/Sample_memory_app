import { describe, expect, it } from 'vitest';
import { TaskSchema } from '../domain/schema';
import { generateUuid, systemClock, uuidGenerator } from './ids';

const idSchema = TaskSchema.shape.id;

describe('generateUuid', () => {
  it('использует crypto.randomUUID, когда он доступен', () => {
    const fake = { getRandomValues: crypto.getRandomValues.bind(crypto), randomUUID: () => 'fixed' };
    expect(generateUuid(fake)).toBe('fixed');
  });

  it('без randomUUID (небезопасный контекст) генерирует валидный UUID v4', () => {
    const fallback = { getRandomValues: crypto.getRandomValues.bind(crypto) };
    for (let i = 0; i < 200; i++) {
      expect(idSchema.safeParse(generateUuid(fallback)).success).toBe(true);
    }
  });

  it('fallback ставит версию 4 и вариант RFC 4122 даже для крайних значений', () => {
    const zeros = { getRandomValues: <T extends ArrayBufferView>(array: T): T => array };
    expect(generateUuid(zeros)).toBe('00000000-0000-4000-8000-000000000000');
  });

  it('генератор не выдаёт повторов', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuidGenerator.next()));
    expect(ids.size).toBe(1000);
  });

  it('системные часы возвращают положительное целое число миллисекунд', () => {
    expect(Number.isInteger(systemClock.now())).toBe(true);
    expect(systemClock.now()).toBeGreaterThan(0);
  });
});

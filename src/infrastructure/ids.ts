import type { Clock, IdGenerator } from '../application/ports';

type CryptoLike = Pick<Crypto, 'getRandomValues'> & { randomUUID?: () => string };

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * crypto.randomUUID() недоступен в небезопасном контексте (http://192.168.x.x при разработке),
 * а getRandomValues доступен всегда. Формируем UUID v4 из него вручную.
 */
function uuidFromRandomValues(source: CryptoLike): string {
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // версия 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // вариант RFC 4122
  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateUuid(source: CryptoLike = crypto): string {
  if (typeof source.randomUUID === 'function') return source.randomUUID();
  return uuidFromRandomValues(source);
}

export const uuidGenerator: IdGenerator = { next: () => generateUuid() };

export const systemClock: Clock = { now: () => Date.now() };

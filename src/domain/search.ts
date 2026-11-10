/**
 * Нормализация для поиска и сравнения названий.
 * NFC — склеивает "и" + "◌̆" в "й" (разные формы записи одной буквы),
 * НЕ удаляет диакритику (иначе "й" превратится в "и"). Только "ё" -> "е".
 */
export function normalizeText(value: string): string {
  return value.normalize('NFC').toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ').trim();
}

export function isSearchMatch(target: string, query: string): boolean {
  const cleanQuery = normalizeText(query);
  if (cleanQuery === '') return true;
  return normalizeText(target).includes(cleanQuery);
}

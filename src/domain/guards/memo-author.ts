import { MEMO_AUTHORS } from '@domain/constants/memo-authors.ts';
import type { MemoAuthor } from '@domain/constants/memo-authors.ts';

export function isMemoAuthor (value: string): value is MemoAuthor {
  return Object.values(MEMO_AUTHORS).some(definition => definition.value === value);
}

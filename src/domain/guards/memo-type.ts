import { MEMO_TYPES } from '@domain/constants/memo-types.ts';
import type { MemoType } from '@domain/constants/memo-types.ts';

export function isMemoType (value: string): value is MemoType {
    return Object.values(MEMO_TYPES).some(definition => definition.value === value);
}

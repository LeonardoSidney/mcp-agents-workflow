import { EDGE_TYPES } from '@domain/constants/edge-types.ts';
import type { EdgeType } from '@domain/constants/edge-types.ts';

export function isEdgeType (value: string): value is EdgeType {
    return Object.values(EDGE_TYPES).some(definition => definition.value === value);
}

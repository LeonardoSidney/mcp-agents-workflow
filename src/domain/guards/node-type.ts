import { NODE_TYPES } from '@domain/constants/node-types.ts';
import type { NodeType } from '@domain/constants/node-types.ts';

export function isNodeType (value: string): value is NodeType {
    return Object.values(NODE_TYPES).some(definition => definition.value === value);
}

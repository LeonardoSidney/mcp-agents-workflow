import { NODE_STATUS } from '@domain/constants/node-status.ts';
import type { NodeStatus } from '@domain/constants/node-status.ts';

export function isNodeStatus (value: string): value is NodeStatus {
    return Object.values(NODE_STATUS).some(definition => definition.value === value);
}

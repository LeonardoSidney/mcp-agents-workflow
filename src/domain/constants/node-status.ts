export interface NodeStatusDefinition {
    value: string;
    description: string;
}

export const NODE_STATUS = {
    PENDING: { value: 'pending', description: 'Node is defined but no work started on it yet.' },
    IN_PROGRESS: { value: 'in_progress', description: 'Node work is actively in progress.' },
    COMPLETED: { value: 'completed', description: 'Node work is completed.' }
} as const satisfies Record<string, NodeStatusDefinition>;

export type NodeStatus = (typeof NODE_STATUS)[keyof typeof NODE_STATUS]['value'];

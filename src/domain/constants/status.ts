export interface StatusDefinition {
    value: string;
    description: string;
}

export const STATUS = {
    WAITING_GOAL: { value: 'waiting_goal', description: 'Project is waiting for a goal to be defined.' },
    IN_PROGRESS: { value: 'in_progress', description: 'Project work is actively in progress.' },
    IN_VALIDATION: { value: 'in_validation', description: 'Project is under validation before completion.' },
    COMPLETED: { value: 'completed', description: 'Project work is completed.' }
} as const satisfies Record<string, StatusDefinition>;

export type Status = (typeof STATUS)[keyof typeof STATUS]['value'];

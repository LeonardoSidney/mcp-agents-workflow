export interface MemoTypeDefinition {
    value: string;
    description: string;
}

export const MEMO_TYPES = {
    NOTE: {
        value: 'note',
        description: 'Ephemeral working state: progress, findings and attempts that are not reusable knowledge. Not searchable.'
    },
    RESOLUTION: {
        value: 'resolution',
        description: 'Confirmed answer to a problem: what worked, why it worked, and under which conditions.'
    },
    DIRECTIVE: {
        value: 'directive',
        description: 'Rule, requirement or decision that future work must respect.'
    }
} as const satisfies Record<string, MemoTypeDefinition>;

export type MemoType = (typeof MEMO_TYPES)[keyof typeof MEMO_TYPES]['value'];

export const SEARCHABLE_MEMO_TYPES: readonly MemoType[] = [
    MEMO_TYPES.RESOLUTION.value,
    MEMO_TYPES.DIRECTIVE.value
];

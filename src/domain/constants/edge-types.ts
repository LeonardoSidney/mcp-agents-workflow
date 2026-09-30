export interface EdgeTypeDefinition {
    value: string;
    description: string;
}

export const EDGE_TYPES = {
    CONTAINS: { value: 'CONTAINS', description: 'Parent contains child.' },
    DEPENDS_ON: { value: 'DEPENDS_ON', description: 'Source requires target.' },
    USER_VALIDATE: { value: 'USER_VALIDATE', description: 'User clarification validates or resolves an agent observation or decision.' },
    BLOCKS: { value: 'BLOCKS', description: 'Source prevents target from progressing.' },
    RELATED_TO: { value: 'RELATED_TO', description: 'Generic semantic relationship.' },
    DERIVED_FROM: { value: 'DERIVED_FROM', description: 'Source was derived from target.' },
    DISCOVERED_BY: { value: 'DISCOVERED_BY', description: 'Information was discovered while executing the source.' },
    CREATED_BY: { value: 'CREATED_BY', description: 'Artifact or information was created by an agent.' },
    ATTEMPTED: { value: 'ATTEMPTED', description: 'Task led to an attempt.' },
    FAILED: { value: 'FAILED', description: 'Attempt resulted in failure.' },
    SOLVED_BY: { value: 'SOLVED_BY', description: 'Problem was resolved by the target.' },
    REJECTED: { value: 'REJECTED', description: 'Approach was rejected.' },
    SUPERSEDES: { value: 'SUPERSEDES', description: 'New decision replaces an older decision.' },
    CONFLICTS_WITH: { value: 'CONFLICTS_WITH', description: 'Source conflicts with target.' },
    CONSTRAINED_BY: { value: 'CONSTRAINED_BY', description: 'Source is constrained by target.' },
    ANSWERS: { value: 'ANSWERS', description: 'Source answers target question.' },
    AFFECTS: { value: 'AFFECTS', description: 'Source affects target.' },
    IMPLEMENTS: { value: 'IMPLEMENTS', description: 'Source implements target decision or requirement.' },
    VALIDATES: { value: 'VALIDATES', description: 'Source validates target.' },
    INVALIDATES: { value: 'INVALIDATES', description: 'Source invalidates target.' },
    ASSIGNED_TO: { value: 'ASSIGNED_TO', description: 'Work is assigned to an agent.' },
    PART_OF: { value: 'PART_OF', description: 'Source belongs to target.' },
    COMPLETES: { value: 'COMPLETES', description: 'Source completes target.' }
} as const satisfies Record<string, EdgeTypeDefinition>;

export type EdgeType = (typeof EDGE_TYPES)[keyof typeof EDGE_TYPES]['value'];

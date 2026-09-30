export interface NodeTypeDefinition {
    value: string;
    description: string;
}

export const NODE_TYPES = {
    PROJECT: { value: 'PROJECT', description: 'Root container for all project knowledge.' },
    GOAL: { value: 'GOAL', description: 'Desired project outcome.' },
    REQUIREMENT: { value: 'REQUIREMENT', description: 'Explicit project requirement.' },
    USER_DECISION: { value: 'USER_DECISION', description: 'Decision or clarification explicitly provided by the user.' },
    AGENT_DECISION: { value: 'AGENT_DECISION', description: 'Decision made by an agent while executing work.' },
    TASK: { value: 'TASK', description: 'Unit of work that an agent can execute.' },
    SUBTASK: { value: 'SUBTASK', description: 'Task that belongs to another task.' },
    AGENT: { value: 'AGENT', description: 'Agent participating in the project.' },
    OBSERVATION: { value: 'OBSERVATION', description: 'Something directly observed during execution.' },
    FACT: { value: 'FACT', description: 'Information considered established and reliable.' },
    HYPOTHESIS: { value: 'HYPOTHESIS', description: 'Possible explanation or assumption that has not been validated.' },
    DISCOVERY: { value: 'DISCOVERY', description: 'New relevant information discovered during execution.' },
    ATTEMPT: { value: 'ATTEMPT', description: 'An action or approach attempted to solve a task.' },
    FAILURE: { value: 'FAILURE', description: 'An attempt that did not achieve its intended result.' },
    SOLUTION: { value: 'SOLUTION', description: 'An approach that successfully solves a problem or task.' },
    REJECTED_APPROACH: { value: 'REJECTED_APPROACH', description: 'An approach explicitly rejected or determined unsuitable.' },
    CONSTRAINT: { value: 'CONSTRAINT', description: 'Limitation that affects possible solutions.' },
    QUESTION: { value: 'QUESTION', description: 'Unresolved question requiring an answer.' },
    CONFLICT: { value: 'CONFLICT', description: 'Contradiction between decisions, facts or requirements.' },
    ARTIFACT: { value: 'ARTIFACT', description: 'File, code, document or other project output.' },
    COMPONENT: { value: 'COMPONENT', description: 'Logical or technical component of the project.' },
    DEPENDENCY: { value: 'DEPENDENCY', description: 'External or internal dependency required by the project.' }
} as const satisfies Record<string, NodeTypeDefinition>;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES]['value'];

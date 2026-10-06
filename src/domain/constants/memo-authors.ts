export interface MemoAuthorDefinition {
  value: string;
  description: string;
}

export const MEMO_AUTHORS = {
  AGENT: { value: 'agent', description: 'Memo written by an agent while executing work.' },
  USER: { value: 'user', description: 'Memo written by the user, with clarifications or rules.' },
  SYSTEM: { value: 'system', description: 'Memo written by the system or orchestration layer.' }
} as const satisfies Record<string, MemoAuthorDefinition>;

export type MemoAuthor = (typeof MEMO_AUTHORS)[keyof typeof MEMO_AUTHORS]['value'];

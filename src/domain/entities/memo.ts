import type { MemoAuthor } from '@domain/constants/memo-authors.ts';
import type { MemoType } from '@domain/constants/memo-types.ts';

export type Memo = {
    id: string;
    nodeId: string;
    author: MemoAuthor;
    type: MemoType;
    text: string;
    createdAt: Date;
};

export type MemoSummary = {
    id: string;
    author: MemoAuthor;
    type: MemoType;
    text: string;
};

export type MemoMatch = {
    id: string;
    author: MemoAuthor;
    type: MemoType;
    text: string;
    score: number;
    createdAt: Date;
};

export function toMemoSummary (memo: Memo): MemoSummary {
    return {
        id: memo.id,
        author: memo.author,
        type: memo.type,
        text: memo.text
    };
}

import type { MemoAuthor } from '@domain/constants/memo-authors.ts';

export type Memo = {
  id: string;
  nodeId: string;
  author: MemoAuthor;
  text: string;
  createdAt: Date;
};

export type MemoSummary = {
  id: string;
  author: MemoAuthor;
  text: string;
};

export function toMemoSummary (memo: Memo): MemoSummary {
  return {
    id: memo.id,
    author: memo.author,
    text: memo.text
  };
}

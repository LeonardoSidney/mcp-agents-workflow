import type { MemoAuthor } from '@domain/constants/memo-authors.ts';
import type { MemoSummary } from '@domain/entities/memo.ts';

export interface IGraphAppendMemoController {
  handle (params: GraphAppendMemoControllerParams): Promise<GraphAppendMemoControllerResponse>;
}

export type GraphAppendMemoControllerParams = {
  nodeId: string;
  author: MemoAuthor;
  text: string;
};

export type GraphAppendMemoControllerResponse = {
  success: boolean;
  memo?: MemoSummary;
  error?: string;
};

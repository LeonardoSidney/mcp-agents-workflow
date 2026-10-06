import type { MemoAuthor } from '@domain/constants/memo-authors.ts';
import type { Memo } from '@domain/entities/memo.ts';

export interface IGraphAppendMemoUseCase {
  execute (params: GraphAppendMemoUseCaseParams): Promise<GraphAppendMemoUseCaseResponse>;
}

export type GraphAppendMemoUseCaseParams = {
  nodeId: string;
  author: MemoAuthor;
  text: string;
};

export type GraphAppendMemoUseCaseResponse = {
  success: boolean;
  memo?: Memo;
  error?: string;
};

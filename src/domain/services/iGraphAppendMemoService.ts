import type { MemoAuthor } from '@domain/constants/memo-authors.ts';
import type { Memo } from '@domain/entities/memo.ts';

export interface IGraphAppendMemoService {
  mapMemo (params: GraphAppendMemoServiceParams): GraphAppendMemoServiceResponse;
}

export type GraphAppendMemoServiceParams = {
  nodeId: string;
  author: MemoAuthor;
  text: string;
};

export type GraphAppendMemoServiceResponse = {
  success: boolean;
  memo?: Memo;
  error?: string;
};

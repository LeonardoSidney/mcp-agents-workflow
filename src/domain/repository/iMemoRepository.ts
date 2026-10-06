import type { Memo } from '@domain/entities/memo.ts';

export interface IMemoRepository {
  addMemo (params: AddMemoRepositoryParams): Promise<void>;
  listMemosByNode (params: ListMemosByNodeRepositoryParams): Promise<Memo[]>;
  deleteMemosByNode (params: DeleteMemosByNodeRepositoryParams): Promise<void>;
}

export type AddMemoRepositoryParams = {
  memo: Memo;
};

export type ListMemosByNodeRepositoryParams = {
  nodeId: string;
};

export type DeleteMemosByNodeRepositoryParams = {
  nodeId: string;
};

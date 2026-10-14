import type { MemoType } from '@domain/constants/memo-types.ts';
import type { Memo } from '@domain/entities/memo.ts';

export interface IMemoRepository {
    addMemo (params: AddMemoRepositoryParams): Promise<void>;
    getMemo (params: GetMemoRepositoryParams): Promise<Memo | null>;
    updateMemoType (params: UpdateMemoTypeRepositoryParams): Promise<boolean>;
    listMemosByNode (params: ListMemosByNodeRepositoryParams): Promise<Memo[]>;
    deleteMemosByNode (params: DeleteMemosByNodeRepositoryParams): Promise<void>;
}

export type AddMemoRepositoryParams = {
    memo: Memo;
};

export type GetMemoRepositoryParams = {
    id: string;
};

export type UpdateMemoTypeRepositoryParams = {
    id: string;
    type: MemoType;
};

export type ListMemosByNodeRepositoryParams = {
    nodeId: string;
};

export type DeleteMemosByNodeRepositoryParams = {
    nodeId: string;
};

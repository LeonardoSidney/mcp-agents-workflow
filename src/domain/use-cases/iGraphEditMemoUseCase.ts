import type { MemoType } from '@domain/constants/memo-types.ts';

export interface IGraphEditMemoUseCase {
    execute (params: GraphEditMemoUseCaseParams): Promise<GraphEditMemoUseCaseResponse>;
}

export type GraphEditMemoUseCaseParams = {
    id: string;
    type: MemoType;
};

export type GraphEditMemoUseCaseResponse = {
    success: boolean;
    error?: string;
};

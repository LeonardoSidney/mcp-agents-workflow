import type { MemoType } from '@domain/constants/memo-types.ts';
import type { NodeWithMemos } from '@domain/entities/node.ts';

export interface IGraphGetNodeUseCase {
    execute (params: GraphGetNodeUseCaseParams): Promise<GraphGetNodeUseCaseResponse>;
}

export type GraphGetNodeUseCaseParams = {
    id: string;
    types?: MemoType[];
};

export type GraphGetNodeUseCaseResponse = {
    success: boolean;
    node?: NodeWithMemos;
    error?: string;
};

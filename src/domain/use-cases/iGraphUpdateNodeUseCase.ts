import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeWithMemos } from '@domain/entities/node.ts';

export interface IGraphUpdateNodeUseCase {
    execute (params: GraphUpdateNodeUseCaseParams): Promise<GraphUpdateNodeUseCaseResponse>;
}

export type GraphUpdateNodeUseCaseParams = {
    id: string;
    title?: string;
    description?: string;
    status?: NodeStatus;
};

export type GraphUpdateNodeUseCaseResponse = {
    success: boolean;
    node?: NodeWithMemos;
    error?: string;
};

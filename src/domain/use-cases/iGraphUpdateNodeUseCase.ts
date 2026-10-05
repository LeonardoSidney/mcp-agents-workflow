import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { EdgeReference } from '@domain/entities/edge.ts';
import type { NodeWithEdges } from '@domain/entities/node.ts';

export interface IGraphUpdateNodeUseCase {
    execute (params: GraphUpdateNodeUseCaseParams): Promise<GraphUpdateNodeUseCaseResponse>;
}

export type GraphUpdateNodeUseCaseParams = {
    id: string;
    title?: string;
    description?: string;
    status?: NodeStatus;
    edges?: EdgeReference[];
};

export type GraphUpdateNodeUseCaseResponse = {
    success: boolean;
    node?: NodeWithEdges;
    error?: string;
};

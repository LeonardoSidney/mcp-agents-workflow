import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { NodeWithEdges } from '@domain/entities/node.ts';

export interface IGraphGetNodesUseCase {
    execute (params: GraphGetNodesUseCaseParams): Promise<GraphGetNodesUseCaseResponse>;
}

export type GraphGetNodesUseCaseParams = {
    graphId: string;
    type?: NodeType;
    status?: NodeStatus;
    limit?: number;
};

export type GraphGetNodesUseCaseResponse = {
    success: boolean;
    nodes?: NodeWithEdges[];
    error?: string;
};

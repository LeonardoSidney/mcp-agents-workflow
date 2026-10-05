import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { Edge } from '@domain/entities/edge.ts';

export interface IGraphAddEdgeUseCase {
    execute (params: GraphAddEdgeUseCaseParams): Promise<GraphAddEdgeUseCaseResponse>;
}

export type GraphAddEdgeUseCaseParams = {
    graphId: string;
    sourceId: string;
    targetId: string;
    type: EdgeType;
    description?: string;
};

export type GraphAddEdgeUseCaseResponse = {
    success: boolean;
    edge?: Edge;
    error?: string;
};

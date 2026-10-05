import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { Edge } from '@domain/entities/edge.ts';

export interface IGraphUpdateEdgeUseCase {
    execute (params: GraphUpdateEdgeUseCaseParams): Promise<GraphUpdateEdgeUseCaseResponse>;
}

export type GraphUpdateEdgeUseCaseParams = {
    id: string;
    type?: EdgeType;
    description?: string;
};

export type GraphUpdateEdgeUseCaseResponse = {
    success: boolean;
    edge?: Edge;
    error?: string;
};

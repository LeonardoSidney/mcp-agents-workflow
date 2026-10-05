import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { Edge } from '@domain/entities/edge.ts';

export interface IGraphUpdateEdgeController {
    handle (params: GraphUpdateEdgeControllerParams): Promise<GraphUpdateEdgeControllerResponse>;
}

export type GraphUpdateEdgeControllerParams = {
    id: string;
    type?: EdgeType;
    description?: string;
};

export type GraphUpdateEdgeControllerResponse = {
    success: boolean;
    edge?: Edge;
    error?: string;
};

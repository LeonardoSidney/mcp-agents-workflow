import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { Edge } from '@domain/entities/edge.ts';

export interface IGraphAddEdgeController {
    handle (params: GraphAddEdgeControllerParams): Promise<GraphAddEdgeControllerResponse>;
}

export type GraphAddEdgeControllerParams = {
    graphId: string;
    sourceId: string;
    targetId: string;
    type: EdgeType;
    description?: string;
};

export type GraphAddEdgeControllerResponse = {
    success: boolean;
    edge?: Edge;
    error?: string;
};

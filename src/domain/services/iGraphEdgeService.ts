import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { Edge } from '@domain/entities/edge.ts';

export interface IGraphAddEdgeService {
    mapEdge (params: GraphAddEdgeServiceParams): GraphAddEdgeServiceResponse;
}

export interface IGraphUpdateEdgeService {
    mapEdgeUpdate (params: GraphUpdateEdgeServiceParams): GraphUpdateEdgeServiceResponse;
}

export type GraphAddEdgeServiceParams = {
    graphId: string;
    sourceId: string;
    targetId: string;
    type: EdgeType;
    description?: string;
};

export type GraphAddEdgeServiceResponse = {
    success: boolean;
    edge?: Edge;
    error?: string;
};

export type GraphUpdateEdgeServiceParams = {
    edge: Edge;
    type?: EdgeType;
    description?: string;
};

export type GraphUpdateEdgeServiceResponse = {
    success: boolean;
    edge?: Edge;
    error?: string;
};

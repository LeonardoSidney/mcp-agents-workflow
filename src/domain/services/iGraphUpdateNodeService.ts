import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { Edge, EdgeReference } from '@domain/entities/edge.ts';
import type { Node } from '@domain/entities/node.ts';

export interface IGraphUpdateNodeService {
    mapUpdate (params: GraphUpdateNodeServiceParams): GraphUpdateNodeServiceResponse;
}

export type GraphUpdateNodeServiceParams = {
    node: Node;
    title?: string;
    description?: string;
    status?: NodeStatus;
    edges?: EdgeReference[];
};

export type GraphUpdateNodeServiceResponse = {
    success: boolean;
    node?: Node;
    edges?: Edge[];
    error?: string;
};

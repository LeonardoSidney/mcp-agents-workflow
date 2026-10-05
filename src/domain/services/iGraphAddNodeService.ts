import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { Edge, EdgeReference } from '@domain/entities/edge.ts';
import type { Node } from '@domain/entities/node.ts';

export interface IGraphAddNodeService {
    mapNode (params: GraphAddNodeServiceParams): GraphAddNodeServiceResponse;
}

export type GraphAddNodeServiceParams = {
    graphId: string;
    type: NodeType;
    title: string;
    description: string;
    status: NodeStatus;
    edges: EdgeReference[];
};

export type GraphAddNodeServiceResponse = {
    success: boolean;
    node?: Node;
    edges?: Edge[];
    error?: string;
};

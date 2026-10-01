import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { Node, NodeLink } from '@domain/entities/node.ts';

export interface IGraphUpdateNodeService {
    mapUpdate (params: GraphUpdateNodeServiceParams): GraphUpdateNodeServiceResponse;
}

export type GraphUpdateNodeServiceParams = {
    node: Node;
    title?: string;
    description?: string;
    status?: NodeStatus;
    links?: NodeLink[];
};

export type GraphUpdateNodeServiceResponse = {
    success: boolean;
    node?: Node;
    error?: string;
};

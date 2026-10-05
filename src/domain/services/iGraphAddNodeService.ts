import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
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
};

export type GraphAddNodeServiceResponse = {
    success: boolean;
    node?: Node;
    error?: string;
};

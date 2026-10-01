import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { Node, NodeLink } from '@domain/entities/node.ts';

export interface IGraphAddNodeController {
    handle (params: GraphAddNodeControllerParams): Promise<GraphAddNodeControllerResponse>;
}

export type GraphAddNodeControllerParams = {
    graphId: string;
    type: NodeType;
    title: string;
    description: string;
    status: NodeStatus;
    links: NodeLink[];
};

export type GraphAddNodeControllerResponse = {
    success: boolean;
    node?: Node;
    error?: string;
};

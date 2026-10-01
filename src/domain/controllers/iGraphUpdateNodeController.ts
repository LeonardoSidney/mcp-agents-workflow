import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { Node, NodeLink } from '@domain/entities/node.ts';

export interface IGraphUpdateNodeController {
    handle (params: GraphUpdateNodeControllerParams): Promise<GraphUpdateNodeControllerResponse>;
}

export type GraphUpdateNodeControllerParams = {
    id: string;
    title?: string;
    description?: string;
    status?: NodeStatus;
    links?: NodeLink[];
};

export type GraphUpdateNodeControllerResponse = {
    success: boolean;
    node?: Node;
    error?: string;
};

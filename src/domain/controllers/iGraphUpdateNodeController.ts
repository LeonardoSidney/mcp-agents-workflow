import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeLink, NodeSummary } from '@domain/entities/node.ts';

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
    node?: NodeSummary;
    error?: string;
};

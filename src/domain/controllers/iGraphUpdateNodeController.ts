import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { EdgeReference } from '@domain/entities/edge.ts';
import type { NodeSummary } from '@domain/entities/node.ts';

export interface IGraphUpdateNodeController {
    handle (params: GraphUpdateNodeControllerParams): Promise<GraphUpdateNodeControllerResponse>;
}

export type GraphUpdateNodeControllerParams = {
    id: string;
    title?: string;
    description?: string;
    status?: NodeStatus;
    edges?: EdgeReference[];
};

export type GraphUpdateNodeControllerResponse = {
    success: boolean;
    node?: NodeSummary;
    error?: string;
};

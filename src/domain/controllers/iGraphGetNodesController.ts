import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { NodeSummary } from '@domain/entities/node.ts';

export interface IGraphGetNodesController {
    handle (params: GraphGetNodesControllerParams): Promise<GraphGetNodesControllerResponse>;
}

export type GraphGetNodesControllerParams = {
    graphId: string;
    type?: NodeType;
    status?: NodeStatus;
    limit?: number;
};

export type GraphGetNodesControllerResponse = {
    success: boolean;
    nodes?: NodeSummary[];
    error?: string;
};

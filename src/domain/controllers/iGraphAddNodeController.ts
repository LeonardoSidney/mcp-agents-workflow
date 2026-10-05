import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { EdgeReference } from '@domain/entities/edge.ts';
import type { NodeSummary } from '@domain/entities/node.ts';

export interface IGraphAddNodeController {
    handle (params: GraphAddNodeControllerParams): Promise<GraphAddNodeControllerResponse>;
}

export type GraphAddNodeControllerParams = {
    graphId: string;
    type: NodeType;
    title: string;
    description: string;
    status: NodeStatus;
    edges: EdgeReference[];
};

export type GraphAddNodeControllerResponse = {
    success: boolean;
    node?: NodeSummary;
    error?: string;
};

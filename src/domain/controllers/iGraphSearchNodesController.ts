import type { NodeSummaryWithEdges } from '@domain/entities/node.ts';

export interface IGraphSearchNodesController {
    handle (params: GraphSearchNodesControllerParams): Promise<GraphSearchNodesControllerResponse>;
}

export type NodeSearchSummaryResult = {
    node: NodeSummaryWithEdges;
    titleScore: number;
    descriptionScore: number;
    score: number;
};

export type GraphSearchNodesControllerParams = {
    graphId: string;
    text: string;
    limit?: number;
};

export type GraphSearchNodesControllerResponse = {
    success: boolean;
    results?: NodeSearchSummaryResult[];
    error?: string;
};

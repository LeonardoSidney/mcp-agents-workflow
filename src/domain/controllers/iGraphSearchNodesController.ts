import type { NodeSummaryWithMemos } from '@domain/entities/node.ts';

export interface IGraphSearchNodesController {
    handle (params: GraphSearchNodesControllerParams): Promise<GraphSearchNodesControllerResponse>;
}

export type NodeSearchSummaryResult = {
    node: NodeSummaryWithMemos;
    titleScore: number;
    descriptionScore: number;
    memoryScore: number;
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

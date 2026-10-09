import type { MemoAuthor } from '@domain/constants/memo-authors.ts';
import type { NodeSummaryWithEdges } from '@domain/entities/node.ts';

export interface IGraphSearchNodesController {
    handle (params: GraphSearchNodesControllerParams): Promise<GraphSearchNodesControllerResponse>;
}

export type MemoMatchSummary = {
    id: string;
    author: MemoAuthor;
    text: string;
    score: number;
};

export type NodeSearchSummaryResult = {
    node: NodeSummaryWithEdges;
    titleScore: number;
    descriptionScore: number;
    memoryScore: number;
    bestMemo?: MemoMatchSummary;
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

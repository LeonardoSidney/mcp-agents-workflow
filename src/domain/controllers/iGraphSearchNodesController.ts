import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { MemoAuthor } from '@domain/constants/memo-authors.ts';
import type { MemoType } from '@domain/constants/memo-types.ts';
import type { NodeBrief } from '@domain/entities/node.ts';

export interface IGraphSearchNodesController {
    handle (params: GraphSearchNodesControllerParams): Promise<GraphSearchNodesControllerResponse>;
}

export type MemoMatchSummary = {
    author: MemoAuthor;
    type: MemoType;
    text: string;
};

export type EdgeMatchSummary = {
    type: EdgeType;
    targetId: string;
    targetTitle?: string;
    description: string;
};

export type NodeSearchSummaryResult = {
    node: NodeBrief;
    score?: number;
    bestMemo?: MemoMatchSummary;
    bestEdge?: EdgeMatchSummary;
};

export type GraphSearchNodesControllerParams = {
    graphId: string;
    text?: string;
    path?: string;
    limit?: number;
};

export type GraphSearchNodesControllerResponse = {
    success: boolean;
    results?: NodeSearchSummaryResult[];
    error?: string;
};

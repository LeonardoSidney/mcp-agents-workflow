import type { MemoMatch } from '@domain/entities/memo.ts';
import type { NodeWithMemos } from '@domain/entities/node.ts';

export interface IGraphSearchNodesService {
    scoreNodes (params: GraphSearchNodesServiceParams): GraphSearchNodesServiceResponse;
}

export type NodeSearchResult = {
    node: NodeWithMemos;
    titleScore: number;
    descriptionScore: number;
    memoryScore: number;
    bestMemo: MemoMatch | null;
    score: number;
};

export type GraphSearchNodesServiceParams = {
    text: string;
    nodes: NodeWithMemos[];
};

export type GraphSearchNodesServiceResponse = {
    success: boolean;
    results?: NodeSearchResult[];
    error?: string;
};

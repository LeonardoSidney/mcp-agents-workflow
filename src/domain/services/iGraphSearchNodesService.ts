import type { Node } from '@domain/entities/node.ts';

export interface IGraphSearchNodesService {
    scoreNodes (params: GraphSearchNodesServiceParams): GraphSearchNodesServiceResponse;
}

export type NodeSearchResult = {
    node: Node;
    titleScore: number;
    descriptionScore: number;
    score: number;
};

export type GraphSearchNodesServiceParams = {
    text: string;
    nodes: Node[];
};

export type GraphSearchNodesServiceResponse = {
    success: boolean;
    results?: NodeSearchResult[];
    error?: string;
};

import type { NodeWithEdges } from '@domain/entities/node.ts';

export interface IGraphSearchNodesService {
    scoreNodes (params: GraphSearchNodesServiceParams): GraphSearchNodesServiceResponse;
}

export type NodeSearchResult = {
    node: NodeWithEdges;
    titleScore: number;
    descriptionScore: number;
    score: number;
};

export type GraphSearchNodesServiceParams = {
    text: string;
    nodes: NodeWithEdges[];
};

export type GraphSearchNodesServiceResponse = {
    success: boolean;
    results?: NodeSearchResult[];
    error?: string;
};

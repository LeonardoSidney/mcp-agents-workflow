import type { Node } from '@domain/entities/node.ts';

export interface IGraphSimilarNodesService {
    findSimilar (params: GraphSimilarNodesServiceParams): Node[];
}

export const SIMILAR_NODES_LIMIT = 3;

export const SIMILAR_TITLE_MIN_SHARED_TOKENS = 2;

export const SIMILAR_TITLE_MIN_OVERLAP = 0.4;

export const SIMILAR_TITLE_MIN_TOKEN_LENGTH = 3;

export const SIMILAR_TITLE_STOPWORDS = [
    'the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'when', 'than', 'then',
    'but', 'not', 'never', 'only', 'are', 'was', 'its', 'via', 'per', 'all', 'any', 'has', 'have', 'each', 'also'
];

export type GraphSimilarNodesServiceParams = {
    node: Node;
    candidates: Node[];
};

export type SimilarNodeCandidate = {
    node: Node;
    similarity: number;
};

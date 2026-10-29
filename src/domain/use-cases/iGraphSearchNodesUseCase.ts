import type { NodeWithMemos } from '@domain/entities/node.ts';
import type { NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';

export interface IGraphSearchNodesUseCase {
    execute (params: GraphSearchNodesUseCaseParams): Promise<GraphSearchNodesUseCaseResponse>;
}

export type GraphSearchNodesUseCaseParams = {
    graphId: string;
    text?: string;
    path?: string;
    limit?: number;
};

export type GraphSearchNodesUseCaseResponse = {
    success: boolean;
    results?: NodeSearchResult[];
    error?: string;
};

export type GraphSearchAnchoredNodesResponse = {
    success: boolean;
    nodes?: NodeWithMemos[];
    error?: string;
};

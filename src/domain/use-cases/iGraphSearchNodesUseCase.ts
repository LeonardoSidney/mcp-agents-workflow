import type { NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';

export interface IGraphSearchNodesUseCase {
    execute (params: GraphSearchNodesUseCaseParams): Promise<GraphSearchNodesUseCaseResponse>;
}

export type GraphSearchNodesUseCaseParams = {
    graphId: string;
    text: string;
    limit?: number;
};

export type GraphSearchNodesUseCaseResponse = {
    success: boolean;
    results?: NodeSearchResult[];
    error?: string;
};

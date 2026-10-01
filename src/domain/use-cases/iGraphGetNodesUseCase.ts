import type { Node } from '@domain/entities/node.ts';

export interface IGraphGetNodesUseCase {
    execute (params: GraphGetNodesUseCaseParams): Promise<GraphGetNodesUseCaseResponse>;
}

export type GraphGetNodesUseCaseParams = {
    graphId: string;
};

export type GraphGetNodesUseCaseResponse = {
    success: boolean;
    nodes?: Node[];
    error?: string;
};

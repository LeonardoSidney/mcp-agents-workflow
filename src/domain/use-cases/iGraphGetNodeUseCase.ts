import type { NodeWithEdges } from '@domain/entities/node.ts';

export interface IGraphGetNodeUseCase {
    execute (params: GraphGetNodeUseCaseParams): Promise<GraphGetNodeUseCaseResponse>;
}

export type GraphGetNodeUseCaseParams = {
    id: string;
};

export type GraphGetNodeUseCaseResponse = {
    success: boolean;
    node?: NodeWithEdges;
    error?: string;
};

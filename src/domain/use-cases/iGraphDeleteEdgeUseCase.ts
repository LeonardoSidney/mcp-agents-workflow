export interface IGraphDeleteEdgeUseCase {
    execute (params: GraphDeleteEdgeUseCaseParams): Promise<GraphDeleteEdgeUseCaseResponse>;
}

export type GraphDeleteEdgeUseCaseParams = {
    id: string;
};

export type GraphDeleteEdgeUseCaseResponse = {
    success: boolean;
    error?: string;
};

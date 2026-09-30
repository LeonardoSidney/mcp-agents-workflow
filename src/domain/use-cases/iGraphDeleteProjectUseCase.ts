export interface IGraphDeleteProjectUseCase {
    execute (params: GraphDeleteProjectUseCaseParams): Promise<GraphDeleteProjectUseCaseResponse>;
}

export type GraphDeleteProjectUseCaseParams = {
    id: string;
};

export type GraphDeleteProjectUseCaseResponse = {
    success: boolean;
    error?: string;
};

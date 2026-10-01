export interface IGraphDeleteNodeUseCase {
    execute (params: GraphDeleteNodeUseCaseParams): Promise<GraphDeleteNodeUseCaseResponse>;
}

export type GraphDeleteNodeUseCaseParams = {
    id: string;
};

export type GraphDeleteNodeUseCaseResponse = {
    success: boolean;
    error?: string;
};

export interface IGraphDeleteProjectController {
    handle (params: GraphDeleteProjectControllerParams): Promise<GraphDeleteProjectControllerResponse>;
}

export type GraphDeleteProjectControllerParams = {
    id: string;
};

export type GraphDeleteProjectControllerResponse = {
    success: boolean;
    error?: string;
};

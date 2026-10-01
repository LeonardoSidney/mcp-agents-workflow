export interface IGraphDeleteNodeController {
    handle (params: GraphDeleteNodeControllerParams): Promise<GraphDeleteNodeControllerResponse>;
}

export type GraphDeleteNodeControllerParams = {
    id: string;
};

export type GraphDeleteNodeControllerResponse = {
    success: boolean;
    error?: string;
};

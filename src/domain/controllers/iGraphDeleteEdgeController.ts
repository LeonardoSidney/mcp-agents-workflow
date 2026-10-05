export interface IGraphDeleteEdgeController {
    handle (params: GraphDeleteEdgeControllerParams): Promise<GraphDeleteEdgeControllerResponse>;
}

export type GraphDeleteEdgeControllerParams = {
    id: string;
};

export type GraphDeleteEdgeControllerResponse = {
    success: boolean;
    error?: string;
};

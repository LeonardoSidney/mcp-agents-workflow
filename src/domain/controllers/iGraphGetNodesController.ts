import type { Node } from '@domain/entities/node.ts';

export interface IGraphGetNodesController {
    handle (params: GraphGetNodesControllerParams): Promise<GraphGetNodesControllerResponse>;
}

export type GraphGetNodesControllerParams = {
    graphId: string;
};

export type GraphGetNodesControllerResponse = {
    success: boolean;
    nodes?: Node[];
    error?: string;
};

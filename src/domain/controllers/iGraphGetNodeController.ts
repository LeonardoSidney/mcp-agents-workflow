import type { NodeSummary } from '@domain/entities/node.ts';

export interface IGraphGetNodeController {
    handle (params: GraphGetNodeControllerParams): Promise<GraphGetNodeControllerResponse>;
}

export type GraphGetNodeControllerParams = {
    id: string;
};

export type GraphGetNodeControllerResponse = {
    success: boolean;
    node?: NodeSummary;
    error?: string;
};

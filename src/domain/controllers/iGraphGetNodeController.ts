import type { MemoType } from '@domain/constants/memo-types.ts';
import type { NodeSummaryWithMemos } from '@domain/entities/node.ts';

export interface IGraphGetNodeController {
    handle (params: GraphGetNodeControllerParams): Promise<GraphGetNodeControllerResponse>;
}

export type GraphGetNodeControllerParams = {
    id: string;
    types?: MemoType[];
};

export type GraphGetNodeControllerResponse = {
    success: boolean;
    node?: NodeSummaryWithMemos;
    error?: string;
};

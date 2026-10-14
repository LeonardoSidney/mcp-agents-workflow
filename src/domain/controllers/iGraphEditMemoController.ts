import type { MemoType } from '@domain/constants/memo-types.ts';

export interface IGraphEditMemoController {
    handle (params: GraphEditMemoControllerParams): Promise<GraphEditMemoControllerResponse>;
}

export type GraphEditMemoControllerParams = {
    id: string;
    type: MemoType;
};

export type GraphEditMemoControllerResponse = {
    success: boolean;
    error?: string;
};

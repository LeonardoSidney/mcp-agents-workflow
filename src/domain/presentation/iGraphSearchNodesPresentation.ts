import type { NodeSearchSummaryResult } from '@domain/controllers/iGraphSearchNodesController.ts';
import type { NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';

export interface IGraphSearchNodesPresentation {
    presentResults (params: GraphSearchNodesPresentationParams): NodeSearchSummaryResult[];
}

export const BEST_MEMO_MIN_SCORE = 0.1;

export type GraphSearchNodesPresentationParams = {
    results: NodeSearchResult[];
    text?: string;
};

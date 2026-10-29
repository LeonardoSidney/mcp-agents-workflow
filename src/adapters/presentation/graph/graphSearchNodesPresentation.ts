import type { MemoMatchSummary, NodeSearchSummaryResult } from '@domain/controllers/iGraphSearchNodesController.ts';
import type { MemoMatch } from '@domain/entities/memo.ts';
import { toNodeSummaryWithEdges } from '@domain/entities/node.ts';
import { BEST_MEMO_MIN_SCORE } from '@domain/presentation/iGraphSearchNodesPresentation.ts';
import type { GraphSearchNodesPresentationParams, IGraphSearchNodesPresentation } from '@domain/presentation/iGraphSearchNodesPresentation.ts';
import type { NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';

export class GraphSearchNodesPresentation implements IGraphSearchNodesPresentation {
    presentResults (params: GraphSearchNodesPresentationParams): NodeSearchSummaryResult[] {
        const isTextSearch = Boolean(params.text?.trim());

        return params.results.map(result => this.summaryResult(result, isTextSearch));
    }

    private summaryResult (result: NodeSearchResult, isTextSearch: boolean): NodeSearchSummaryResult {
        const node = toNodeSummaryWithEdges(result.node);
        if (!isTextSearch) {
            return { node };
        }

        return {
            node,
            titleScore: this.round(result.titleScore),
            descriptionScore: this.round(result.descriptionScore),
            memoryScore: this.round(result.memoryScore),
            bestMemo: this.bestMemoSummary(result.bestMemo),
            score: this.round(result.score)
        };
    }

    private round (value: number): number {
        return Number(value.toFixed(2));
    }

    private bestMemoSummary (bestMemo: MemoMatch | null): MemoMatchSummary | undefined {
        if (!bestMemo) {
            return undefined;
        }

        if (bestMemo.score < BEST_MEMO_MIN_SCORE) {
            return undefined;
        }

        return {
            id: bestMemo.id,
            author: bestMemo.author,
            type: bestMemo.type,
            text: bestMemo.text,
            score: this.round(bestMemo.score)
        };
    }
}

import type { EdgeMatchSummary, MemoMatchSummary, NodeSearchSummaryResult } from '@domain/controllers/iGraphSearchNodesController.ts';
import type { EdgeMatch } from '@domain/entities/edge.ts';
import type { MemoMatch } from '@domain/entities/memo.ts';
import { toNodeBrief } from '@domain/entities/node.ts';
import { BEST_MEMO_MIN_SCORE } from '@domain/presentation/iGraphSearchNodesPresentation.ts';
import type { GraphSearchNodesPresentationParams, IGraphSearchNodesPresentation } from '@domain/presentation/iGraphSearchNodesPresentation.ts';
import type { NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';

export class GraphSearchNodesPresentation implements IGraphSearchNodesPresentation {
    presentResults (params: GraphSearchNodesPresentationParams): NodeSearchSummaryResult[] {
        const isTextSearch = Boolean(params.text?.trim());

        return params.results.map(result => this.summaryResult(result, isTextSearch));
    }

    private summaryResult (result: NodeSearchResult, isTextSearch: boolean): NodeSearchSummaryResult {
        const node = toNodeBrief(result.node);
        if (!isTextSearch) {
            return { node };
        }

        const summary: NodeSearchSummaryResult = {
            node,
            score: this.round(result.score)
        };

        const bestMemo = this.bestMemoSummary(result.bestMemo);
        if (bestMemo) {
            summary.bestMemo = bestMemo;
        }

        const bestEdge = this.bestEdgeSummary(result.bestEdge);
        if (bestEdge) {
            summary.bestEdge = bestEdge;
        }

        return summary;
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
            author: bestMemo.author,
            type: bestMemo.type,
            text: bestMemo.text
        };
    }

    private bestEdgeSummary (bestEdge: EdgeMatch | null): EdgeMatchSummary | undefined {
        if (!bestEdge) {
            return undefined;
        }

        const summary: EdgeMatchSummary = {
            type: bestEdge.type,
            targetId: bestEdge.targetId,
            description: bestEdge.description
        };

        if (bestEdge.targetTitle !== undefined) {
            summary.targetTitle = bestEdge.targetTitle;
        }

        return summary;
    }
}

import type { EdgeReference } from '@domain/entities/edge.ts';
import type { Memo, MemoMatch } from '@domain/entities/memo.ts';
import type { GraphSearchNodesServiceParams, GraphSearchNodesServiceResponse, IGraphSearchNodesService, NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';

export class GraphSearchNodesService implements IGraphSearchNodesService {
    scoreNodes (params: GraphSearchNodesServiceParams): GraphSearchNodesServiceResponse {
        const queryTokens = this.uniqueTokens(this.toTokens(params.text));
        if (queryTokens.length === 0) {
            return {
                success: false,
                error: 'A non-empty search text is required'
            };
        }

        const results: NodeSearchResult[] = [];

        for (const node of params.nodes) {
            const titleScore = this.fieldScore(queryTokens, node.title);
            const descriptionScore = this.fieldScore(queryTokens, node.description);
            const bestMemo = this.bestMatchingMemo(queryTokens, node.memos);
            const edgeScore = this.bestEdgeScore(queryTokens, node.edges);
            let memoScore = 0;
            if (bestMemo) {
                memoScore = bestMemo.score;
            }
            const memoryScore = Math.max(edgeScore, memoScore);

            if (titleScore === 0 && descriptionScore === 0 && memoryScore === 0) {
                continue;
            }

            results.push({
                node,
                titleScore,
                descriptionScore,
                memoryScore,
                bestMemo,
                score: (titleScore + descriptionScore + memoryScore) / 3
            });
        }

        return {
            success: true,
            results
        };
    }

    private bestEdgeScore (queryTokens: string[], edges: EdgeReference[]): number {
        let bestScore = 0;

        for (const edge of edges) {
            if (!edge.description) {
                continue;
            }

            bestScore = Math.max(bestScore, this.fieldScore(queryTokens, edge.description));
        }

        return bestScore;
    }

    private bestMatchingMemo (queryTokens: string[], memos: Memo[]): MemoMatch | null {
        let best: MemoMatch | null = null;

        for (const memo of memos) {
            const score = this.fieldScore(queryTokens, memo.text);
            if (score === 0) {
                continue;
            }

            const beatsBest = best === null || score > best.score;
            const isTie = best !== null && score === best.score;
            const isNewest = isTie && memo.createdAt.getTime() > (best as MemoMatch).createdAt.getTime();

            if (beatsBest || isNewest) {
                best = {
                    id: memo.id,
                    author: memo.author,
                    text: memo.text,
                    score,
                    createdAt: memo.createdAt
                };
            }
        }

        return best;
    }

    private toTokens (text: string): string[] {
        const normalized = text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        return normalized.split(/[^a-z0-9]+/).filter(token => token.length > 0);
    }

    private uniqueTokens (tokens: string[]): string[] {
        return [...new Set(tokens)];
    }

    private fieldScore (queryTokens: string[], field: string): number {
        const fieldTokens = this.toTokens(field);
        const totalLength = queryTokens.length + fieldTokens.length;

        const lcs = this.longestCommonSubsequence(queryTokens, fieldTokens);
        return (2 * lcs) / totalLength;
    }

    private longestCommonSubsequence (a: string[], b: string[]): number {
        const cols = b.length;
        let previousRow: number[] = new Array<number>(cols + 1).fill(0);

        for (const aToken of a) {
            const currentRow: number[] = new Array<number>(cols + 1).fill(0);

            let j = 0;
            for (const bToken of b) {
                j += 1;
                const diagonal = previousRow[j - 1] as number;
                const up = previousRow[j] as number;
                const left = currentRow[j - 1] as number;
                currentRow[j] = aToken === bToken ? diagonal + 1 : Math.max(up, left);
            }

            previousRow = currentRow;
        }

        return previousRow[cols] as number;
    }
}

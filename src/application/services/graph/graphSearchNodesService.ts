import { SEARCHABLE_MEMO_TYPES } from '@domain/constants/memo-types.ts';
import type { EdgeMatch, EdgeReference } from '@domain/entities/edge.ts';
import type { Memo, MemoMatch } from '@domain/entities/memo.ts';
import type { NodeWithMemos } from '@domain/entities/node.ts';
import { toSearchTokens } from '@application/utils/searchTokens.ts';
import type { GraphSearchNodesServiceParams, GraphSearchNodesServiceResponse, IGraphSearchNodesService, NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';

export class GraphSearchNodesService implements IGraphSearchNodesService {
    scoreNodes (params: GraphSearchNodesServiceParams): GraphSearchNodesServiceResponse {
        const queryTokens = this.uniqueTokens(toSearchTokens(params.text));
        if (queryTokens.length === 0) {
            return {
                success: false,
                error: 'A non-empty search text is required'
            };
        }

        const results: NodeSearchResult[] = [];

        for (const node of params.nodes) {
            const searchableMemos = this.searchableMemos(node.memos);
            const nodeTokens = this.nodeSurfaceTokens(node, searchableMemos);
            const edgeOnlyTokens = queryTokens.filter(token => !nodeTokens.has(token));

            if (!this.edgesCoverTokens(node.edges, edgeOnlyTokens)) {
                continue;
            }

            const titleScore = this.fieldScore(queryTokens, node.title);
            const descriptionScore = this.fieldScore(queryTokens, node.description);
            const bestMemo = this.bestMatchingMemo(queryTokens, searchableMemos);
            const edgeScore = this.bestEdgeScore(queryTokens, node.edges);
            const bestEdge = this.responsibleEdge(queryTokens, edgeOnlyTokens, node.edges);
            let memoScore = 0;
            if (bestMemo) {
                memoScore = bestMemo.score;
            }
            const memoryScore = Math.max(edgeScore, memoScore);

            results.push({
                node,
                titleScore,
                descriptionScore,
                memoryScore,
                bestMemo,
                bestEdge,
                score: (titleScore + descriptionScore + memoryScore) / 3
            });
        }

        return {
            success: true,
            results
        };
    }

    private nodeSurfaceTokens (node: NodeWithMemos, memos: Memo[]): Set<string> {
        const surfaceTokens = new Set<string>();

        for (const token of toSearchTokens(node.title)) {
            surfaceTokens.add(token);
        }

        for (const token of toSearchTokens(node.description)) {
            surfaceTokens.add(token);
        }

        for (const memo of memos) {
            for (const token of toSearchTokens(memo.text)) {
                surfaceTokens.add(token);
            }
        }

        return surfaceTokens;
    }

    private edgesCoverTokens (edges: EdgeReference[], tokens: string[]): boolean {
        if (tokens.length === 0) {
            return true;
        }

        const edgeTokens = new Set<string>();

        for (const edge of edges) {
            if (!edge.description) {
                continue;
            }

            for (const token of toSearchTokens(edge.description)) {
                edgeTokens.add(token);
            }
        }

        return tokens.every(token => edgeTokens.has(token));
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

    private responsibleEdge (queryTokens: string[], edgeOnlyTokens: string[], edges: EdgeReference[]): EdgeMatch | null {
        if (edgeOnlyTokens.length === 0) {
            return null;
        }

        let best: EdgeMatch | null = null;

        for (const edge of edges) {
            if (!edge.description) {
                continue;
            }

            const edgeTokens = toSearchTokens(edge.description);
            if (!edgeOnlyTokens.some(token => edgeTokens.includes(token))) {
                continue;
            }

            const score = this.fieldScore(queryTokens, edge.description);
            if (best !== null && score <= best.score) {
                continue;
            }

            best = {
                type: edge.type,
                targetId: edge.targetId,
                targetTitle: edge.targetTitle,
                description: edge.description,
                score
            };
        }

        return best;
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
                    type: memo.type,
                    text: memo.text,
                    score,
                    createdAt: memo.createdAt
                };
            }
        }

        return best;
    }

    private searchableMemos (memos: Memo[]): Memo[] {
        return memos.filter(memo => SEARCHABLE_MEMO_TYPES.includes(memo.type));
    }

    private uniqueTokens (tokens: string[]): string[] {
        return [...new Set(tokens)];
    }

    private fieldScore (queryTokens: string[], field: string): number {
        const fieldTokens = toSearchTokens(field);
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

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

            if (titleScore === 0 && descriptionScore === 0) {
                continue;
            }

            results.push({
                node,
                titleScore,
                descriptionScore,
                score: (titleScore + descriptionScore) / 2
            });
        }

        return {
            success: true,
            results
        };
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
        if (totalLength === 0) {
            return 0;
        }

        const lcs = this.longestCommonSubsequence(queryTokens, fieldTokens);
        return (2 * lcs) / totalLength;
    }

    private longestCommonSubsequence (a: string[], b: string[]): number {
        const rows = a.length;
        const cols = b.length;

        const table: number[][] = [];
        for (let i = 0; i <= rows; i++) {
            table.push(new Array<number>(cols + 1).fill(0));
        }

        for (let i = 1; i <= rows; i++) {
            const aToken = a[i - 1];
            for (let j = 1; j <= cols; j++) {
                const bToken = b[j - 1];
                const previousRow = table[i - 1];
                const currentRow = table[i];

                if (!aToken || !bToken || !previousRow || !currentRow) {
                    continue;
                }

                if (aToken === bToken) {
                    const diagonal = previousRow[j - 1] ?? 0;
                    currentRow[j] = diagonal + 1;
                } else {
                    const up = previousRow[j] ?? 0;
                    const left = currentRow[j - 1] ?? 0;
                    currentRow[j] = Math.max(up, left);
                }
            }
        }

        const lastRow = table[rows];
        return lastRow ? (lastRow[cols] ?? 0) : 0;
    }
}

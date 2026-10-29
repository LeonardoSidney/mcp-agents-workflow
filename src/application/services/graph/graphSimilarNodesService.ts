import type { Node } from '@domain/entities/node.ts';
import type { IGraphNodeAnchorService } from '@domain/services/iGraphNodeAnchorService.ts';
import { SIMILAR_NODES_LIMIT, SIMILAR_TITLE_MIN_OVERLAP, SIMILAR_TITLE_MIN_SHARED_TOKENS, SIMILAR_TITLE_MIN_TOKEN_LENGTH, SIMILAR_TITLE_STOPWORDS } from '@domain/services/iGraphSimilarNodesService.ts';
import type { GraphSimilarNodesServiceParams, IGraphSimilarNodesService, SimilarNodeCandidate } from '@domain/services/iGraphSimilarNodesService.ts';
import { toSearchTokens } from '@application/utils/searchTokens.ts';

export class GraphSimilarNodesService implements IGraphSimilarNodesService {
    private readonly graphNodeAnchorService: IGraphNodeAnchorService;

    constructor (
        graphNodeAnchorService: IGraphNodeAnchorService
    ) {
        this.graphNodeAnchorService = graphNodeAnchorService;
    }

    findSimilar (params: GraphSimilarNodesServiceParams): Node[] {
        const titleTokens = this.meaningfulTokens(params.node.title);
        const ranked: SimilarNodeCandidate[] = [];

        for (const candidate of params.candidates) {
            if (candidate.id === params.node.id || candidate.type !== params.node.type) {
                continue;
            }

            const candidateTokens = this.meaningfulTokens(candidate.title);
            const sharedCount = [...titleTokens].filter(token => candidateTokens.has(token)).length;
            const unionCount = Math.max(titleTokens.size + candidateTokens.size - sharedCount, 1);
            const similarity = sharedCount / unionCount;
            const hasSimilarTitle = sharedCount >= SIMILAR_TITLE_MIN_SHARED_TOKENS && similarity >= SIMILAR_TITLE_MIN_OVERLAP;

            if (!hasSimilarTitle && !this.sharesPaths(params.node.paths, candidate.paths)) {
                continue;
            }

            ranked.push({ node: candidate, similarity });
        }

        return ranked
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, SIMILAR_NODES_LIMIT)
            .map(candidate => candidate.node);
    }

    private meaningfulTokens (title: string): Set<string> {
        const tokens = toSearchTokens(title).filter(token => token.length >= SIMILAR_TITLE_MIN_TOKEN_LENGTH && !SIMILAR_TITLE_STOPWORDS.includes(token));

        return new Set(tokens);
    }

    private sharesPaths (nodePaths: string[], candidatePaths: string[]): boolean {
        return nodePaths.some(path => this.graphNodeAnchorService.matchesPath(candidatePaths, path));
    }
}

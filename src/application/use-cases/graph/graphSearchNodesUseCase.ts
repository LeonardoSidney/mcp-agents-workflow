import type { GraphSearchNodesServiceResponse, IGraphSearchNodesService, NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';
import type { IGraphNodeAnchorService } from '@domain/services/iGraphNodeAnchorService.ts';
import type { NodeWithMemos } from '@domain/entities/node.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { GraphSearchAnchoredNodesResponse, GraphSearchNodesUseCaseParams, GraphSearchNodesUseCaseResponse, IGraphSearchNodesUseCase } from '@domain/use-cases/iGraphSearchNodesUseCase.ts';

export class GraphSearchNodesUseCase implements IGraphSearchNodesUseCase {
    private readonly logger: ILogger;
    private readonly searchService: IGraphSearchNodesService;
    private readonly graphNodeAnchorService: IGraphNodeAnchorService;
    private readonly projectRepository: IProjectRepository;
    private readonly nodeRepository: INodeRepository;

    constructor (
        logger: ILogger,
        searchService: IGraphSearchNodesService,
        graphNodeAnchorService: IGraphNodeAnchorService,
        projectRepository: IProjectRepository,
        nodeRepository: INodeRepository
    ) {
        this.logger = logger;
        this.searchService = searchService;
        this.graphNodeAnchorService = graphNodeAnchorService;
        this.projectRepository = projectRepository;
        this.nodeRepository = nodeRepository;
    }

    async execute (params: GraphSearchNodesUseCaseParams): Promise<GraphSearchNodesUseCaseResponse> {
        this.logger.info('Executing GraphSearchNodesUseCase::execute');

        const validationError = this.validate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const graph = await this.projectRepository.getProject({ id: params.graphId });
        if (!graph) {
            return {
                success: false,
                error: `Graph not found: ${params.graphId}`
            };
        }

        const anchoredNodes = await this.anchoredNodes(params);
        if (!anchoredNodes.success || !anchoredNodes.nodes) {
            return {
                success: false,
                error: anchoredNodes.error ?? 'Invalid search path'
            };
        }

        const scored = this.score(anchoredNodes.nodes, params.text);
        if (!scored.success || !scored.results) {
            return {
                success: false,
                error: scored.error ?? 'Unable to score the search results'
            };
        }

        const ordered = this.order(scored.results);
        const results = params.limit ? ordered.slice(0, params.limit) : ordered;

        await this.nodeRepository.recordSearchHits({ ids: results.map(result => result.node.id) });

        return {
            success: true,
            results
        };
    }

    private validate (params: GraphSearchNodesUseCaseParams): string | undefined {
        if (!params.graphId?.trim()) {
            return 'A non-empty graph id is required';
        }

        if (!params.text?.trim() && !params.path?.trim()) {
            return 'A non-empty search text or path is required';
        }

        return undefined;
    }

    private async anchoredNodes (params: GraphSearchNodesUseCaseParams): Promise<GraphSearchAnchoredNodesResponse> {
        const nodes = await this.nodeRepository.getNodesWithMemos({ graphId: params.graphId });
        if (!params.path?.trim()) {
            return {
                success: true,
                nodes
            };
        }

        const normalized = this.graphNodeAnchorService.normalizePath(params.path);
        if (!normalized.success || normalized.path === undefined) {
            return {
                success: false,
                error: normalized.error
            };
        }

        const path = normalized.path;

        return {
            success: true,
            nodes: nodes.filter(node => this.graphNodeAnchorService.matchesPath(node.paths, path))
        };
    }

    private score (nodes: NodeWithMemos[], text: string | undefined): GraphSearchNodesServiceResponse {
        if (text?.trim()) {
            return this.searchService.scoreNodes({ text, nodes });
        }

        return {
            success: true,
            results: nodes.map(node => ({
                node,
                titleScore: 0,
                descriptionScore: 0,
                memoryScore: 0,
                bestMemo: null,
                bestEdge: null,
                score: 0
            }))
        };
    }

    private order (results: NodeSearchResult[]): NodeSearchResult[] {
        return [...results].sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return b.node.createdAt.getTime() - a.node.createdAt.getTime();
        });
    }
}

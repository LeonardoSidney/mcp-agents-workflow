import type { IGraphSearchNodesService, NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { GraphSearchNodesUseCaseParams, GraphSearchNodesUseCaseResponse, IGraphSearchNodesUseCase } from '@domain/use-cases/iGraphSearchNodesUseCase.ts';

export class GraphSearchNodesUseCase implements IGraphSearchNodesUseCase {
    private readonly logger: ILogger;
    private readonly searchService: IGraphSearchNodesService;
    private readonly projectRepository: IProjectRepository;
    private readonly nodeRepository: INodeRepository;

    constructor (
        logger: ILogger,
        searchService: IGraphSearchNodesService,
        projectRepository: IProjectRepository,
        nodeRepository: INodeRepository
    ) {
        this.logger = logger;
        this.searchService = searchService;
        this.projectRepository = projectRepository;
        this.nodeRepository = nodeRepository;
    }

    async execute (params: GraphSearchNodesUseCaseParams): Promise<GraphSearchNodesUseCaseResponse> {
        this.logger.info('Executing GraphSearchNodesUseCase::execute');

        if (!params.graphId?.trim()) {
            return {
                success: false,
                error: 'A non-empty graph id is required'
            };
        }

        if (!params.text?.trim()) {
            return {
                success: false,
                error: 'A non-empty search text is required'
            };
        }

        const graph = await this.projectRepository.getProject({ id: params.graphId });
        if (!graph) {
            return {
                success: false,
                error: `Graph not found: ${params.graphId}`
            };
        }

        const nodes = await this.nodeRepository.getNodesWithMemos({ graphId: params.graphId });

        const scored = this.searchService.scoreNodes({ text: params.text, nodes });
        if (!scored.success || !scored.results) {
            return {
                success: false,
                error: scored.error ?? 'Unable to score the search results'
            };
        }

        const ordered = this.order(scored.results);
        const results = params.limit ? ordered.slice(0, params.limit) : ordered;

        return {
            success: true,
            results
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

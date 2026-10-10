import type { ILogger } from '@domain/logger.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { IEdgeRepository } from '@domain/repository/iEdgeRepository.ts';
import type { IGraphAddEdgeService } from '@domain/services/iGraphEdgeService.ts';
import type { GraphAddEdgeUseCaseParams, GraphAddEdgeUseCaseResponse, IGraphAddEdgeUseCase } from '@domain/use-cases/iGraphAddEdgeUseCase.ts';

export class GraphAddEdgeUseCase implements IGraphAddEdgeUseCase {
    private readonly logger: ILogger;
    private readonly projectRepository: IProjectRepository;
    private readonly nodeRepository: INodeRepository;
    private readonly edgeRepository: IEdgeRepository;
    private readonly graphAddEdgeService: IGraphAddEdgeService;

    constructor (
        logger: ILogger,
        projectRepository: IProjectRepository,
        nodeRepository: INodeRepository,
        edgeRepository: IEdgeRepository,
        graphAddEdgeService: IGraphAddEdgeService
    ) {
        this.logger = logger;
        this.projectRepository = projectRepository;
        this.nodeRepository = nodeRepository;
        this.edgeRepository = edgeRepository;
        this.graphAddEdgeService = graphAddEdgeService;
    }

    async execute (params: GraphAddEdgeUseCaseParams): Promise<GraphAddEdgeUseCaseResponse> {
        this.logger.info('Executing GraphAddEdgeUseCase::execute');

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

        const source = await this.nodeRepository.getNode({ id: params.sourceId });
        if (!source) {
            return {
                success: false,
                error: `Source node not found: ${params.sourceId}`
            };
        }

        if (source.graphId !== params.graphId) {
            return {
                success: false,
                error: `Source node does not belong to graph ${params.graphId}: ${params.sourceId}`
            };
        }

        const target = await this.nodeRepository.getNode({ id: params.targetId });
        if (!target) {
            return {
                success: false,
                error: `Target node not found: ${params.targetId}`
            };
        }

        if (target.graphId !== params.graphId) {
            return {
                success: false,
                error: `Target node does not belong to graph ${params.graphId}: ${params.targetId}`
            };
        }

        const mapped = this.graphAddEdgeService.mapEdge(params);
        if (!mapped.success || !mapped.edge) {
            return {
                success: false,
                error: mapped.error ?? 'Failed to map the edge'
            };
        }

        await this.edgeRepository.addEdge({ edge: mapped.edge });

        this.logger.info('Edge added', mapped.edge);

        return {
            success: true,
            edge: mapped.edge
        };
    }

    private validate (params: GraphAddEdgeUseCaseParams): string | undefined {
        if (!params.graphId?.trim()) {
            return 'A non-empty graph id is required';
        }

        if (!params.sourceId?.trim()) {
            return 'A non-empty source node id is required';
        }

        if (!params.targetId?.trim()) {
            return 'A non-empty target node id is required';
        }

        return undefined;
    }
}

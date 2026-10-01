import type { ILogger } from '@domain/logger.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { GraphGetNodesUseCaseParams, GraphGetNodesUseCaseResponse, IGraphGetNodesUseCase } from '@domain/use-cases/iGraphGetNodesUseCase.ts';

export class GraphGetNodesUseCase implements IGraphGetNodesUseCase {
    private readonly logger: ILogger;
    private readonly projectRepository: IProjectRepository;
    private readonly nodeRepository: INodeRepository;

    constructor (
        logger: ILogger,
        projectRepository: IProjectRepository,
        nodeRepository: INodeRepository
    ) {
        this.logger = logger;
        this.projectRepository = projectRepository;
        this.nodeRepository = nodeRepository;
    }

    async execute (params: GraphGetNodesUseCaseParams): Promise<GraphGetNodesUseCaseResponse> {
        this.logger.info('Executing GraphGetNodesUseCase::execute');

        if (!params.graphId?.trim()) {
            return {
                success: false,
                error: 'A non-empty graph id is required'
            };
        }

        const graph = await this.projectRepository.getProject({ id: params.graphId });
        if (!graph) {
            return {
                success: false,
                error: `Graph not found: ${params.graphId}`
            };
        }

        const nodes = await this.nodeRepository.getNodes({ graphId: params.graphId });

        return {
            success: true,
            nodes
        };
    }
}

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

        const nodes = await this.nodeRepository.getNodes({
            graphId: params.graphId,
            types: params.types,
            status: params.status,
            limit: params.limit
        });

        return {
            success: true,
            nodes
        };
    }

    private validate (params: GraphGetNodesUseCaseParams): string | undefined {
        if (!params.graphId?.trim()) {
            return 'A non-empty graph id is required';
        }

        return undefined;
    }
}

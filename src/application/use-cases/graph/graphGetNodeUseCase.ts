import type { ILogger } from '@domain/logger.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { GraphGetNodeUseCaseParams, GraphGetNodeUseCaseResponse, IGraphGetNodeUseCase } from '@domain/use-cases/iGraphGetNodeUseCase.ts';

export class GraphGetNodeUseCase implements IGraphGetNodeUseCase {
    private readonly logger: ILogger;
    private readonly nodeRepository: INodeRepository;

    constructor (
        logger: ILogger,
        nodeRepository: INodeRepository
    ) {
        this.logger = logger;
        this.nodeRepository = nodeRepository;
    }

    async execute (params: GraphGetNodeUseCaseParams): Promise<GraphGetNodeUseCaseResponse> {
        this.logger.info('Executing GraphGetNodeUseCase::execute');

        if (!params.id?.trim()) {
            return {
                success: false,
                error: 'A non-empty node id is required'
            };
        }

        const node = await this.nodeRepository.getNode({ id: params.id });
        if (!node) {
            return {
                success: false,
                error: `Node not found: ${params.id}`
            };
        }

        return {
            success: true,
            node
        };
    }
}

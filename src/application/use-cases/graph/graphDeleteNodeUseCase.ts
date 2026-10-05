import type { ILogger } from '@domain/logger.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { GraphDeleteNodeUseCaseParams, GraphDeleteNodeUseCaseResponse, IGraphDeleteNodeUseCase } from '@domain/use-cases/iGraphDeleteNodeUseCase.ts';

export class GraphDeleteNodeUseCase implements IGraphDeleteNodeUseCase {
    private readonly logger: ILogger;
    private readonly nodeRepository: INodeRepository;

    constructor (
        logger: ILogger,
        nodeRepository: INodeRepository
    ) {
        this.logger = logger;
        this.nodeRepository = nodeRepository;
    }

    async execute (params: GraphDeleteNodeUseCaseParams): Promise<GraphDeleteNodeUseCaseResponse> {
        this.logger.info('Executing GraphDeleteNodeUseCase::execute');

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

        const referencedByIds = await this.nodeRepository.listReferencingNodeIds({ graphId: node.graphId, targetId: params.id });
        if (referencedByIds.length > 0) {
            const referencedBy = referencedByIds.join(', ');
            return {
                success: false,
                error: `Node is referenced by ${referencedBy}; update those edges first, deleting it would erase the recorded graph memory`
            };
        }

        const deleted = await this.nodeRepository.deleteNode({ id: params.id });
        if (!deleted) {
            return {
                success: false,
                error: `Node not found: ${params.id}`
            };
        }

        return {
            success: true
        };
    }
}

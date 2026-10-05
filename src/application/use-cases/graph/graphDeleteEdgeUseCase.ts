import type { ILogger } from '@domain/logger.ts';
import type { IEdgeRepository } from '@domain/repository/iEdgeRepository.ts';
import type { GraphDeleteEdgeUseCaseParams, GraphDeleteEdgeUseCaseResponse, IGraphDeleteEdgeUseCase } from '@domain/use-cases/iGraphDeleteEdgeUseCase.ts';

export class GraphDeleteEdgeUseCase implements IGraphDeleteEdgeUseCase {
    private readonly logger: ILogger;
    private readonly edgeRepository: IEdgeRepository;

    constructor (
        logger: ILogger,
        edgeRepository: IEdgeRepository
    ) {
        this.logger = logger;
        this.edgeRepository = edgeRepository;
    }

    async execute (params: GraphDeleteEdgeUseCaseParams): Promise<GraphDeleteEdgeUseCaseResponse> {
        this.logger.info('Executing GraphDeleteEdgeUseCase::execute');

        if (!params.id?.trim()) {
            return {
                success: false,
                error: 'A non-empty edge id is required'
            };
        }

        const edge = await this.edgeRepository.getEdge({ id: params.id });
        if (!edge) {
            return {
                success: false,
                error: `Edge not found: ${params.id}`
            };
        }

        const deleted = await this.edgeRepository.deleteEdge({ graphId: edge.graphId, id: params.id });
        if (!deleted) {
            return {
                success: false,
                error: `Edge not found: ${params.id}`
            };
        }

        return {
            success: true
        };
    }
}

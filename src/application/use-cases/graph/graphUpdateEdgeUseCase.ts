import type { ILogger } from '@domain/logger.ts';
import type { IEdgeRepository } from '@domain/repository/iEdgeRepository.ts';
import type { IGraphUpdateEdgeService } from '@domain/services/iGraphEdgeService.ts';
import type { GraphUpdateEdgeUseCaseParams, GraphUpdateEdgeUseCaseResponse, IGraphUpdateEdgeUseCase } from '@domain/use-cases/iGraphUpdateEdgeUseCase.ts';

export class GraphUpdateEdgeUseCase implements IGraphUpdateEdgeUseCase {
    private readonly logger: ILogger;
    private readonly edgeRepository: IEdgeRepository;
    private readonly graphUpdateEdgeService: IGraphUpdateEdgeService;

    constructor (
        logger: ILogger,
        edgeRepository: IEdgeRepository,
        graphUpdateEdgeService: IGraphUpdateEdgeService
    ) {
        this.logger = logger;
        this.edgeRepository = edgeRepository;
        this.graphUpdateEdgeService = graphUpdateEdgeService;
    }

    async execute (params: GraphUpdateEdgeUseCaseParams): Promise<GraphUpdateEdgeUseCaseResponse> {
        this.logger.info('Executing GraphUpdateEdgeUseCase::execute');

        const validationError = this.validate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const edge = await this.edgeRepository.getEdge({ id: params.id });
        if (!edge) {
            return {
                success: false,
                error: `Edge not found: ${params.id}`
            };
        }

        const mapped = this.graphUpdateEdgeService.mapEdgeUpdate({
            edge,
            type: params.type,
            description: params.description
        });
        if (!mapped.success || !mapped.edge) {
            return {
                success: false,
                error: mapped.error ?? 'Failed to map the edge update'
            };
        }

        const persisted = await this.edgeRepository.updateEdge({ edge: mapped.edge });
        if (!persisted) {
            return {
                success: false,
                error: `Edge not found: ${params.id}`
            };
        }

        return {
            success: true,
            edge: mapped.edge
        };
    }

    private validate (params: GraphUpdateEdgeUseCaseParams): string | undefined {
        if (!params.id?.trim()) {
            return 'A non-empty edge id is required';
        }

        if (params.type === undefined && params.description === undefined) {
            return 'At least one field must be provided to update an edge';
        }

        if (params.description !== undefined && !params.description.trim()) {
            return 'A non-empty description is required';
        }

        return undefined;
    }
}

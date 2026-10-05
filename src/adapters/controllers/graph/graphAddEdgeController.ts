import type { GraphAddEdgeControllerParams, GraphAddEdgeControllerResponse, IGraphAddEdgeController } from '@domain/controllers/iGraphAddEdgeController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphAddEdgeUseCase } from '@domain/use-cases/iGraphAddEdgeUseCase.ts';

export class GraphAddEdgeController implements IGraphAddEdgeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphAddEdgeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphAddEdgeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphAddEdgeControllerParams): Promise<GraphAddEdgeControllerResponse> {
        this.logger.info('Executing GraphAddEdgeController::handle');

        const { graphId, sourceId, targetId, type, description } = params;

        const response = await this.useCase.execute({ graphId, sourceId, targetId, type, description });

        return {
            success: response.success,
            edge: response.edge,
            error: response.error
        };
    }
}

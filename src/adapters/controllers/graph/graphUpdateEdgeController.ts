import type { GraphUpdateEdgeControllerParams, GraphUpdateEdgeControllerResponse, IGraphUpdateEdgeController } from '@domain/controllers/iGraphUpdateEdgeController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphUpdateEdgeUseCase } from '@domain/use-cases/iGraphUpdateEdgeUseCase.ts';

export class GraphUpdateEdgeController implements IGraphUpdateEdgeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphUpdateEdgeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphUpdateEdgeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphUpdateEdgeControllerParams): Promise<GraphUpdateEdgeControllerResponse> {
        this.logger.info('Executing GraphUpdateEdgeController::handle', params);

        const { id, type, description } = params;

        const response = await this.useCase.execute({ id, type, description });

        const result = {
            success: response.success,
            edge: response.edge,
            error: response.error
        };

        this.logger.info('GraphUpdateEdgeController::handle result', result);

        return result;
    }
}

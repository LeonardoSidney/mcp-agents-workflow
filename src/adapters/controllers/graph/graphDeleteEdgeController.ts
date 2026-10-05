import type { GraphDeleteEdgeControllerParams, GraphDeleteEdgeControllerResponse, IGraphDeleteEdgeController } from '@domain/controllers/iGraphDeleteEdgeController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphDeleteEdgeUseCase } from '@domain/use-cases/iGraphDeleteEdgeUseCase.ts';

export class GraphDeleteEdgeController implements IGraphDeleteEdgeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphDeleteEdgeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphDeleteEdgeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphDeleteEdgeControllerParams): Promise<GraphDeleteEdgeControllerResponse> {
        this.logger.info('Executing GraphDeleteEdgeController::handle');

        const { id } = params;

        const response = await this.useCase.execute({ id });

        return {
            success: response.success,
            error: response.error
        };
    }
}

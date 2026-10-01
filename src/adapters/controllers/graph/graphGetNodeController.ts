import type { GraphGetNodeControllerParams, GraphGetNodeControllerResponse, IGraphGetNodeController } from '@domain/controllers/iGraphGetNodeController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphGetNodeUseCase } from '@domain/use-cases/iGraphGetNodeUseCase.ts';

export class GraphGetNodeController implements IGraphGetNodeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphGetNodeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphGetNodeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphGetNodeControllerParams): Promise<GraphGetNodeControllerResponse> {
        this.logger.info('Executing GraphGetNodeController::handle');

        const { id } = params;

        const response = await this.useCase.execute({ id });

        return {
            success: response.success,
            node: response.node,
            error: response.error
        };
    }
}

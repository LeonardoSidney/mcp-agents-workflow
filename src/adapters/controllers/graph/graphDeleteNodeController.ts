import type { GraphDeleteNodeControllerParams, GraphDeleteNodeControllerResponse, IGraphDeleteNodeController } from '@domain/controllers/iGraphDeleteNodeController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphDeleteNodeUseCase } from '@domain/use-cases/iGraphDeleteNodeUseCase.ts';

export class GraphDeleteNodeController implements IGraphDeleteNodeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphDeleteNodeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphDeleteNodeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphDeleteNodeControllerParams): Promise<GraphDeleteNodeControllerResponse> {
        this.logger.info('Executing GraphDeleteNodeController::handle');

        const { id } = params;

        const response = await this.useCase.execute({ id });

        return {
            success: response.success,
            error: response.error
        };
    }
}

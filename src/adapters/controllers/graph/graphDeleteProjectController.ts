import type { GraphDeleteProjectControllerParams, GraphDeleteProjectControllerResponse, IGraphDeleteProjectController } from '@domain/controllers/iGraphDeleteProjectController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphDeleteProjectUseCase } from '@domain/use-cases/iGraphDeleteProjectUseCase.ts';

export class GraphDeleteProjectController implements IGraphDeleteProjectController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphDeleteProjectUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphDeleteProjectUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphDeleteProjectControllerParams): Promise<GraphDeleteProjectControllerResponse> {
        this.logger.info('Executing GraphDeleteProjectController::handle');

        const { id } = params;

        const response = await this.useCase.execute({ id });

        return {
            success: response.success,
            error: response.error
        };
    }
}

import type { GraphGetProjectControllerParams, GraphGetProjectControllerResponse, IGraphGetProjectController } from '@domain/controllers/iGraphGetProjectController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphGetProjectUseCase } from '@domain/use-cases/iGraphGetProjectUseCase.ts';

export class GraphGetProjectController implements IGraphGetProjectController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphGetProjectUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphGetProjectUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphGetProjectControllerParams): Promise<GraphGetProjectControllerResponse> {
        this.logger.info('Executing GraphGetProjectController::handle');

        const { id } = params;

        const response = await this.useCase.execute({ id });

        return {
            success: response.success,
            project: response.project,
            error: response.error
        };
    }
}

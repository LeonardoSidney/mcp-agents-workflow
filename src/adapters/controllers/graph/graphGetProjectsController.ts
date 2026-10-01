import type { GraphGetProjectsControllerResponse, IGraphGetProjectsController } from '@domain/controllers/iGraphGetProjectsController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphGetProjectsUseCase } from '@domain/use-cases/iGraphGetProjectsUseCase.ts';

export class GraphGetProjectsController implements IGraphGetProjectsController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphGetProjectsUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphGetProjectsUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (): Promise<GraphGetProjectsControllerResponse> {
        this.logger.info('Executing GraphGetProjectsController::handle');

        const response = await this.useCase.execute();

        return {
            success: response.success,
            projects: response.projects,
            error: response.error
        };
    }
}

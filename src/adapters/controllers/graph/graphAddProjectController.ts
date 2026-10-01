import type { GraphAddControllerParams, GraphAddControllerResponse, IGraphAddController } from '@domain/controllers/iGraphAddController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphAddUseCase } from '@domain/use-cases/iGraphAddUseCase.ts';

export class GraphAddController implements IGraphAddController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphAddUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphAddUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphAddControllerParams): Promise<GraphAddControllerResponse> {
        this.logger.info('Executing GraphAddController::handle');

        const { name, description, status } = params;

        const response = await this.useCase.execute({ name, description, status });

        return {
            success: response.success,
            project: response.project,
            error: response.error
        };
    }
}

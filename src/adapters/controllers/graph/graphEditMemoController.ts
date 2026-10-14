import type { GraphEditMemoControllerParams, GraphEditMemoControllerResponse, IGraphEditMemoController } from '@domain/controllers/iGraphEditMemoController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphEditMemoUseCase } from '@domain/use-cases/iGraphEditMemoUseCase.ts';

export class GraphEditMemoController implements IGraphEditMemoController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphEditMemoUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphEditMemoUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphEditMemoControllerParams): Promise<GraphEditMemoControllerResponse> {
        this.logger.info('Executing GraphEditMemoController::handle', params);

        const { id, type } = params;

        const response = await this.useCase.execute({ id, type });

        const result = {
            success: response.success,
            error: response.error
        };

        this.logger.info('GraphEditMemoController::handle result', result);

        return result;
    }
}

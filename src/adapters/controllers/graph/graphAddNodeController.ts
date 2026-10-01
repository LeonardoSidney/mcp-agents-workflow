import type { GraphAddNodeControllerParams, GraphAddNodeControllerResponse, IGraphAddNodeController } from '@domain/controllers/iGraphAddNodeController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphAddNodeUseCase } from '@domain/use-cases/iGraphAddNodeUseCase.ts';

export class GraphAddNodeController implements IGraphAddNodeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphAddNodeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphAddNodeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphAddNodeControllerParams): Promise<GraphAddNodeControllerResponse> {
        this.logger.info('Executing GraphAddNodeController::handle');

        const { graphId, type, title, description, status, links } = params;

        const response = await this.useCase.execute({ graphId, type, title, description, status, links });

        return {
            success: response.success,
            node: response.node,
            error: response.error
        };
    }
}

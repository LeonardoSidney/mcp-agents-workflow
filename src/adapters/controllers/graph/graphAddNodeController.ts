import type { GraphAddNodeControllerParams, GraphAddNodeControllerResponse, IGraphAddNodeController } from '@domain/controllers/iGraphAddNodeController.ts';
import { toNodeSummary } from '@domain/entities/node.ts';
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
        this.logger.info('Executing GraphAddNodeController::handle', params);

        const { graphId, type, title, description, status } = params;

        const response = await this.useCase.execute({ graphId, type, title, description, status });

        const node = response.node ? toNodeSummary(response.node) : undefined;

        const result = {
            success: response.success,
            node,
            error: response.error
        };

        this.logger.info('GraphAddNodeController::handle result', result);

        return result;
    }
}

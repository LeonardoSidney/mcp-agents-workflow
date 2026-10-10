import type { GraphUpdateNodeControllerParams, GraphUpdateNodeControllerResponse, IGraphUpdateNodeController } from '@domain/controllers/iGraphUpdateNodeController.ts';
import { toNodeSummary } from '@domain/entities/node.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphUpdateNodeUseCase } from '@domain/use-cases/iGraphUpdateNodeUseCase.ts';

export class GraphUpdateNodeController implements IGraphUpdateNodeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphUpdateNodeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphUpdateNodeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphUpdateNodeControllerParams): Promise<GraphUpdateNodeControllerResponse> {
        this.logger.info('Executing GraphUpdateNodeController::handle', params);

        const { id, title, description, status } = params;

        const response = await this.useCase.execute({ id, title, description, status });

        const node = response.node ? toNodeSummary(response.node) : undefined;

        const result = {
            success: response.success,
            node,
            error: response.error
        };

        this.logger.info('GraphUpdateNodeController::handle result', result);

        return result;
    }
}

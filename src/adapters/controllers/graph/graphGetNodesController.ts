import type { GraphGetNodesControllerParams, GraphGetNodesControllerResponse, IGraphGetNodesController } from '@domain/controllers/iGraphGetNodesController.ts';
import { toNodeSummary } from '@domain/entities/node.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphGetNodesUseCase } from '@domain/use-cases/iGraphGetNodesUseCase.ts';

export class GraphGetNodesController implements IGraphGetNodesController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphGetNodesUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphGetNodesUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphGetNodesControllerParams): Promise<GraphGetNodesControllerResponse> {
        this.logger.info('Executing GraphGetNodesController::handle');

        const { graphId, type, status, limit } = params;

        const response = await this.useCase.execute({ graphId, type, status, limit });

        const nodes = response.nodes?.map(node => toNodeSummary(node));

        return {
            success: response.success,
            nodes,
            error: response.error
        };
    }
}

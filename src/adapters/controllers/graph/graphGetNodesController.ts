import type { GraphGetNodesControllerParams, GraphGetNodesControllerResponse, IGraphGetNodesController } from '@domain/controllers/iGraphGetNodesController.ts';
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

        const { graphId } = params;

        const response = await this.useCase.execute({ graphId });

        return {
            success: response.success,
            nodes: response.nodes,
            error: response.error
        };
    }
}

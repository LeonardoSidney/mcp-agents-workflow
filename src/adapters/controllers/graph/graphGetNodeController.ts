import type { GraphGetNodeControllerParams, GraphGetNodeControllerResponse, IGraphGetNodeController } from '@domain/controllers/iGraphGetNodeController.ts';
import { toNodeSummaryWithEdges } from '@domain/entities/node.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphGetNodeUseCase } from '@domain/use-cases/iGraphGetNodeUseCase.ts';

export class GraphGetNodeController implements IGraphGetNodeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphGetNodeUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphGetNodeUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphGetNodeControllerParams): Promise<GraphGetNodeControllerResponse> {
        this.logger.info('Executing GraphGetNodeController::handle');

        const { id } = params;

        const response = await this.useCase.execute({ id });

        const node = response.node ? toNodeSummaryWithEdges(response.node) : undefined;

        return {
            success: response.success,
            node,
            error: response.error
        };
    }
}

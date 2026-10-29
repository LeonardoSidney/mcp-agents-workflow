import type { GraphGetNodesControllerParams, GraphGetNodesControllerResponse, IGraphGetNodesController } from '@domain/controllers/iGraphGetNodesController.ts';
import type { NodeBrief, NodeWithEdges } from '@domain/entities/node.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphGetNodesPresentation } from '@domain/presentation/iGraphGetNodesPresentation.ts';
import type { IGraphGetNodesUseCase } from '@domain/use-cases/iGraphGetNodesUseCase.ts';

export class GraphGetNodesController implements IGraphGetNodesController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphGetNodesUseCase;
    private readonly presentation: IGraphGetNodesPresentation;

    constructor (
        logger: ILogger,
        useCase: IGraphGetNodesUseCase,
        presentation: IGraphGetNodesPresentation
    ) {
        this.logger = logger;
        this.useCase = useCase;
        this.presentation = presentation;
    }

    async handle (params: GraphGetNodesControllerParams): Promise<GraphGetNodesControllerResponse> {
        this.logger.info('Executing GraphGetNodesController::handle', params);

        const { graphId, type, status, limit } = params;

        const response = await this.useCase.execute({ graphId, type, status, limit });

        const nodes = this.presentNodes(response.nodes);

        const result = {
            success: response.success,
            nodes,
            error: response.error
        };

        this.logger.info('GraphGetNodesController::handle result', result);

        return result;
    }

    private presentNodes (nodes: NodeWithEdges[] | undefined): NodeBrief[] | undefined {
        if (!nodes) {
            return undefined;
        }

        return this.presentation.presentNodes({ nodes });
    }
}

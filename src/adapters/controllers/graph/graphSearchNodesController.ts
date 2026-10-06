import type { GraphSearchNodesControllerParams, GraphSearchNodesControllerResponse, IGraphSearchNodesController } from '@domain/controllers/iGraphSearchNodesController.ts';
import { toNodeSummaryWithMemos } from '@domain/entities/node.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphSearchNodesUseCase } from '@domain/use-cases/iGraphSearchNodesUseCase.ts';

export class GraphSearchNodesController implements IGraphSearchNodesController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphSearchNodesUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphSearchNodesUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphSearchNodesControllerParams): Promise<GraphSearchNodesControllerResponse> {
        this.logger.info('Executing GraphSearchNodesController::handle');

        const { graphId, text, limit } = params;

        const response = await this.useCase.execute({ graphId, text, limit });

        if (!response.success || !response.results) {
            return {
                success: false,
                error: response.error
            };
        }

        const results = response.results.map(result => ({
            node: toNodeSummaryWithMemos(result.node),
            titleScore: this.round(result.titleScore),
            descriptionScore: this.round(result.descriptionScore),
            memoryScore: this.round(result.memoryScore),
            score: this.round(result.score)
        }));

        return {
            success: true,
            results
        };
    }

    private round (value: number): number {
        return Number(value.toFixed(2));
    }
}

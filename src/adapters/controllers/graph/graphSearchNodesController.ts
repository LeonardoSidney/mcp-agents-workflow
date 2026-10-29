import type { GraphSearchNodesControllerParams, GraphSearchNodesControllerResponse, IGraphSearchNodesController } from '@domain/controllers/iGraphSearchNodesController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphSearchNodesPresentation } from '@domain/presentation/iGraphSearchNodesPresentation.ts';
import type { IGraphSearchNodesUseCase } from '@domain/use-cases/iGraphSearchNodesUseCase.ts';

export class GraphSearchNodesController implements IGraphSearchNodesController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphSearchNodesUseCase;
    private readonly presentation: IGraphSearchNodesPresentation;

    constructor (
        logger: ILogger,
        useCase: IGraphSearchNodesUseCase,
        presentation: IGraphSearchNodesPresentation
    ) {
        this.logger = logger;
        this.useCase = useCase;
        this.presentation = presentation;
    }

    async handle (params: GraphSearchNodesControllerParams): Promise<GraphSearchNodesControllerResponse> {
        this.logger.info('Executing GraphSearchNodesController::handle', params);

        const { graphId, text, path, limit } = params;

        const response = await this.useCase.execute({ graphId, text, path, limit });

        if (!response.success || !response.results) {
            const result = {
                success: false,
                error: response.error
            };

            this.logger.info('GraphSearchNodesController::handle result', result);

            return result;
        }

        const results = this.presentation.presentResults({ results: response.results, text });

        const result = {
            success: true,
            results
        };

        this.logger.info('GraphSearchNodesController::handle result', result);

        return result;
    }
}

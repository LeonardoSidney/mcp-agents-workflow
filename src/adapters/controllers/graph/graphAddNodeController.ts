import type { GraphAddNodeControllerParams, GraphAddNodeControllerResponse, IGraphAddNodeController } from '@domain/controllers/iGraphAddNodeController.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphAddNodePresentation } from '@domain/presentation/iGraphAddNodePresentation.ts';
import type { IGraphAddNodeUseCase } from '@domain/use-cases/iGraphAddNodeUseCase.ts';

export class GraphAddNodeController implements IGraphAddNodeController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphAddNodeUseCase;
    private readonly presentation: IGraphAddNodePresentation;

    constructor (
        logger: ILogger,
        useCase: IGraphAddNodeUseCase,
        presentation: IGraphAddNodePresentation
    ) {
        this.logger = logger;
        this.useCase = useCase;
        this.presentation = presentation;
    }

    async handle (params: GraphAddNodeControllerParams): Promise<GraphAddNodeControllerResponse> {
        this.logger.info('Executing GraphAddNodeController::handle', params);

        const { graphId, type, title, description, status, paths, commit } = params;

        const response = await this.useCase.execute({ graphId, type, title, description, status, paths, commit });

        if (!response.success || !response.node) {
            const result = {
                success: false,
                error: response.error
            };

            this.logger.info('GraphAddNodeController::handle result', result);

            return result;
        }

        const presented = this.presentation.present({ node: response.node, similarNodes: response.similarNodes ?? [] });

        const result = {
            success: true,
            ...presented
        };

        this.logger.info('GraphAddNodeController::handle result', result);

        return result;
    }
}

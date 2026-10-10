import type { GraphAppendMemoControllerParams, GraphAppendMemoControllerResponse, IGraphAppendMemoController } from '@domain/controllers/iGraphAppendMemoController.ts';
import { toMemoSummary } from '@domain/entities/memo.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IGraphAppendMemoUseCase } from '@domain/use-cases/iGraphAppendMemoUseCase.ts';

export class GraphAppendMemoController implements IGraphAppendMemoController {
    private readonly logger: ILogger;
    private readonly useCase: IGraphAppendMemoUseCase;

    constructor (
        logger: ILogger,
        useCase: IGraphAppendMemoUseCase
    ) {
        this.logger = logger;
        this.useCase = useCase;
    }

    async handle (params: GraphAppendMemoControllerParams): Promise<GraphAppendMemoControllerResponse> {
        this.logger.info('Executing GraphAppendMemoController::handle', params);

        const { nodeId, author, text } = params;

        const response = await this.useCase.execute({ nodeId, author, text });

        if (!response.success || !response.memo) {
            const result = {
                success: false,
                error: response.error
            };

            this.logger.info('GraphAppendMemoController::handle result', result);

            return result;
        }

        const memo = toMemoSummary(response.memo);

        const result = {
            success: true,
            memo
        };

        this.logger.info('GraphAppendMemoController::handle result', result);

        return result;
    }
}

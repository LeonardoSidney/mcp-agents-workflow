import { isMemoType } from '@domain/guards/memo-type.ts';
import type { ILogger } from '@domain/logger.ts';
import type { IMemoRepository } from '@domain/repository/iMemoRepository.ts';
import type { GraphEditMemoUseCaseParams, GraphEditMemoUseCaseResponse, IGraphEditMemoUseCase } from '@domain/use-cases/iGraphEditMemoUseCase.ts';

export class GraphEditMemoUseCase implements IGraphEditMemoUseCase {
    private readonly logger: ILogger;
    private readonly memoRepository: IMemoRepository;

    constructor (
        logger: ILogger,
        memoRepository: IMemoRepository
    ) {
        this.logger = logger;
        this.memoRepository = memoRepository;
    }

    async execute (params: GraphEditMemoUseCaseParams): Promise<GraphEditMemoUseCaseResponse> {
        this.logger.info('Executing GraphEditMemoUseCase::execute');

        if (!params.id?.trim()) {
            return {
                success: false,
                error: 'A non-empty memo id is required'
            };
        }

        if (!isMemoType(params.type)) {
            return {
                success: false,
                error: 'Invalid memo type'
            };
        }

        const memo = await this.memoRepository.getMemo({ id: params.id });
        if (!memo) {
            return {
                success: false,
                error: `Memo not found: ${params.id}`
            };
        }

        const updated = await this.memoRepository.updateMemoType({ id: params.id, type: params.type });
        if (!updated) {
            return {
                success: false,
                error: `Memo not found: ${params.id}`
            };
        }

        this.logger.info('Memo type updated', { id: memo.id, from: memo.type, to: params.type });

        return {
            success: true
        };
    }
}

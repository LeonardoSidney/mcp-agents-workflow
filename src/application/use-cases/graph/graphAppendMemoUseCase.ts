import type { ILogger } from '@domain/logger.ts';
import type { IGraphAppendMemoService } from '@domain/services/iGraphAppendMemoService.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { IMemoRepository } from '@domain/repository/iMemoRepository.ts';
import type { GraphAppendMemoUseCaseParams, GraphAppendMemoUseCaseResponse, IGraphAppendMemoUseCase } from '@domain/use-cases/iGraphAppendMemoUseCase.ts';

export class GraphAppendMemoUseCase implements IGraphAppendMemoUseCase {
  private readonly logger: ILogger;
  private readonly graphAppendMemoService: IGraphAppendMemoService;
  private readonly nodeRepository: INodeRepository;
  private readonly memoRepository: IMemoRepository;

  constructor (
    logger: ILogger,
    graphAppendMemoService: IGraphAppendMemoService,
    nodeRepository: INodeRepository,
    memoRepository: IMemoRepository
  ) {
    this.logger = logger;
    this.graphAppendMemoService = graphAppendMemoService;
    this.nodeRepository = nodeRepository;
    this.memoRepository = memoRepository;
  }

  async execute (params: GraphAppendMemoUseCaseParams): Promise<GraphAppendMemoUseCaseResponse> {
    this.logger.info('Executing GraphAppendMemoUseCase::execute');

    if (!params.nodeId?.trim()) {
      return {
        success: false,
        error: 'A non-empty node id is required'
      };
    }

    if (!params.text?.trim()) {
      return {
        success: false,
        error: 'A non-empty memo text is required'
      };
    }

    const node = await this.nodeRepository.getNode({ id: params.nodeId });
    if (!node) {
      return {
        success: false,
        error: `Node not found: ${params.nodeId}`
      };
    }

    const mapped = this.graphAppendMemoService.mapMemo({
      nodeId: params.nodeId,
      author: params.author,
      text: params.text
    });
    if (!mapped.success || !mapped.memo) {
      return {
        success: false,
        error: mapped.error ?? 'Failed to map the memo'
      };
    }

    await this.memoRepository.addMemo({ memo: mapped.memo });

    return {
      success: true,
      memo: mapped.memo
    };
  }
}

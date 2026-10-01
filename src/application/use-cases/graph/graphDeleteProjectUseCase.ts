import type { ILogger } from '@domain/logger.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { GraphDeleteProjectUseCaseParams, GraphDeleteProjectUseCaseResponse, IGraphDeleteProjectUseCase } from '@domain/use-cases/iGraphDeleteProjectUseCase.ts';

export class GraphDeleteProjectUseCase implements IGraphDeleteProjectUseCase {
    private readonly logger: ILogger;
    private readonly projectRepository: IProjectRepository;

    constructor (
        logger: ILogger,
        projectRepository: IProjectRepository
    ) {
        this.logger = logger;
        this.projectRepository = projectRepository;
    }

    async execute (params: GraphDeleteProjectUseCaseParams): Promise<GraphDeleteProjectUseCaseResponse> {
        this.logger.info('Executing GraphDeleteProjectUseCase::execute');

        if (!params.id?.trim()) {
            return {
                success: false,
                error: 'A non-empty project id is required'
            };
        }

        const deleted = await this.projectRepository.deleteProject({ id: params.id });
        if (!deleted) {
            return {
                success: false,
                error: `Project not found: ${params.id}`
            };
        }

        return {
            success: true
        };
    }
}

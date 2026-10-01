import type { ILogger } from '@domain/logger.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { GraphGetProjectUseCaseParams, GraphGetProjectUseCaseResponse, IGraphGetProjectUseCase } from '@domain/use-cases/iGraphGetProjectUseCase.ts';

export class GraphGetProjectUseCase implements IGraphGetProjectUseCase {
    private readonly logger: ILogger;
    private readonly projectRepository: IProjectRepository;

    constructor (
        logger: ILogger,
        projectRepository: IProjectRepository
    ) {
        this.logger = logger;
        this.projectRepository = projectRepository;
    }

    async execute (params: GraphGetProjectUseCaseParams): Promise<GraphGetProjectUseCaseResponse> {
        this.logger.info('Executing GraphGetProjectUseCase::execute');

        if (!params.id?.trim()) {
            return {
                success: false,
                error: 'A non-empty project id is required'
            };
        }

        const project = await this.projectRepository.getProject({ id: params.id });
        if (!project) {
            return {
                success: false,
                error: `Project not found: ${params.id}`
            };
        }

        return {
            success: true,
            project
        };
    }
}

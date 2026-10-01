import type { ILogger } from '@domain/logger.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { GraphGetProjectsUseCaseResponse, IGraphGetProjectsUseCase } from '@domain/use-cases/iGraphGetProjectsUseCase.ts';

export class GraphGetProjectsUseCase implements IGraphGetProjectsUseCase {
    private readonly logger: ILogger;
    private readonly projectRepository: IProjectRepository;

    constructor (
        logger: ILogger,
        projectRepository: IProjectRepository
    ) {
        this.logger = logger;
        this.projectRepository = projectRepository;
    }

    async execute (): Promise<GraphGetProjectsUseCaseResponse> {
        this.logger.info('Executing GraphGetProjectsUseCase::execute');

        const projects = await this.projectRepository.getProjects();

        return {
            success: true,
            projects
        };
    }
}

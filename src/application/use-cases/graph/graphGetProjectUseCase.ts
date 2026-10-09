import type { Project } from '@domain/entities/project.ts';
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

        const hasId = Boolean(params.id?.trim());
        const hasName = Boolean(params.name?.trim());
        if (!hasId && !hasName) {
            return {
                success: false,
                error: 'Provide either a project id or a project name'
            };
        }

        if (hasId && hasName) {
            return {
                success: false,
                error: 'Provide either a project id or a project name, not both'
            };
        }

        const project = await this.fetchProject(params);
        if (!project) {
            return {
                success: false,
                error: `Project not found: ${params.id ?? params.name}`
            };
        }

        return {
            success: true,
            project
        };
    }

    private async fetchProject (params: GraphGetProjectUseCaseParams): Promise<Project | null> {
        if (params.id?.trim()) {
            return this.projectRepository.getProject({ id: params.id });
        }

        if (params.name?.trim()) {
            return this.projectRepository.getProjectByName({ name: params.name });
        }

        return null;
    }
}

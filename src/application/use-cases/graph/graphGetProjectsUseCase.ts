import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { GraphGetProjectsUseCaseResponse, IGraphGetProjectsUseCase } from '@domain/use-cases/iGraphGetProjectsUseCase.ts';

export class GraphGetProjectsUseCase implements IGraphGetProjectsUseCase {
    private readonly projectRepository: IProjectRepository;

    constructor (
        projectRepository: IProjectRepository
    ) {
        this.projectRepository = projectRepository;
    }

    async execute (): Promise<GraphGetProjectsUseCaseResponse> {
        const projects = await this.projectRepository.getProjects();

        return {
            success: true,
            projects
        };
    }
}

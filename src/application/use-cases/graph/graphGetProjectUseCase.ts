import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { GraphGetProjectUseCaseParams, GraphGetProjectUseCaseResponse, IGraphGetProjectUseCase } from '@domain/use-cases/iGraphGetProjectUseCase.ts';

export class GraphGetProjectUseCase implements IGraphGetProjectUseCase {
    private readonly projectRepository: IProjectRepository;

    constructor (
        projectRepository: IProjectRepository
    ) {
        this.projectRepository = projectRepository;
    }

    async execute (params: GraphGetProjectUseCaseParams): Promise<GraphGetProjectUseCaseResponse> {
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

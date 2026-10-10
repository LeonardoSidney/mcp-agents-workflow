import type { ILogger } from '@domain/logger.ts';
import type { IGraphAddService } from '@domain/services/iGraphAddService.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { GraphAddUseCaseParams, GraphAddUseCaseResponse, IGraphAddUseCase } from '@domain/use-cases/iGraphAddUseCase.ts';

export class GraphAddUseCase implements IGraphAddUseCase {
    private readonly logger: ILogger;
    private readonly graphAddService: IGraphAddService;
    private readonly projectRepository: IProjectRepository;

    constructor (
        logger: ILogger,
        graphAddService: IGraphAddService,
        projectRepository: IProjectRepository
    ) {
        this.logger = logger;
        this.graphAddService = graphAddService;
        this.projectRepository = projectRepository;
    }

    async execute (params: GraphAddUseCaseParams): Promise<GraphAddUseCaseResponse> {
        this.logger.info('Executing GraphAddUseCase::execute');

        const validationError = this.validate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const duplicate = await this.projectRepository.getProjectByName({ name: params.name });
        if (duplicate) {
            return {
                success: false,
                error: `A project with this name already exists: ${params.name}`
            };
        }

        const { success, project, error } = this.graphAddService.mapProject(params);
        if (!success) {
            return {
                success: false,
                error: error ?? 'Failed to map the project'
            };
        }

        if (!project) {
            return {
                success: false,
                error: 'Failed to map the project'
            };
        }

        await this.projectRepository.addProject({ project });

        this.logger.info('Project added', project);

        return {
            success: true,
            project
        };
    }

    private validate (params: GraphAddUseCaseParams): string | undefined {
        if (!params.name?.trim()) {
            return 'A non-empty name is required';
        }

        if (!params.description?.trim()) {
            return 'A non-empty description is required';
        }

        return undefined;
    }
}

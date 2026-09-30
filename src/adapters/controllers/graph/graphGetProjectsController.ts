import type { GraphGetProjectsControllerResponse, IGraphGetProjectsController } from '@domain/controllers/iGraphGetProjectsController.ts';
import type { IGraphGetProjectsUseCase } from '@domain/use-cases/iGraphGetProjectsUseCase.ts';

export class GraphGetProjectsController implements IGraphGetProjectsController {
    private readonly useCase: IGraphGetProjectsUseCase;

    constructor (
        useCase: IGraphGetProjectsUseCase
    ) {
        this.useCase = useCase;
    }

    async handle (): Promise<GraphGetProjectsControllerResponse> {
        const response = await this.useCase.execute();

        return {
            success: response.success,
            projects: response.projects,
            error: response.error
        };
    }
}

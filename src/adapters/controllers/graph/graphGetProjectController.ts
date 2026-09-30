import type { GraphGetProjectControllerParams, GraphGetProjectControllerResponse, IGraphGetProjectController } from '@domain/controllers/iGraphGetProjectController.ts';
import type { IGraphGetProjectUseCase } from '@domain/use-cases/iGraphGetProjectUseCase.ts';

export class GraphGetProjectController implements IGraphGetProjectController {
    private readonly useCase: IGraphGetProjectUseCase;

    constructor (
        useCase: IGraphGetProjectUseCase
    ) {
        this.useCase = useCase;
    }

    async handle (params: GraphGetProjectControllerParams): Promise<GraphGetProjectControllerResponse> {
        const { id } = params;

        const response = await this.useCase.execute({ id });

        return {
            success: response.success,
            project: response.project,
            error: response.error
        };
    }
}

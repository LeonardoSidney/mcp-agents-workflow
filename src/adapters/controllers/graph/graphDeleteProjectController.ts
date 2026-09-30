import type { GraphDeleteProjectControllerParams, GraphDeleteProjectControllerResponse, IGraphDeleteProjectController } from '@domain/controllers/iGraphDeleteProjectController.ts';
import type { IGraphDeleteProjectUseCase } from '@domain/use-cases/iGraphDeleteProjectUseCase.ts';

export class GraphDeleteProjectController implements IGraphDeleteProjectController {
    private readonly useCase: IGraphDeleteProjectUseCase;

    constructor (
        useCase: IGraphDeleteProjectUseCase
    ) {
        this.useCase = useCase;
    }

    async handle (params: GraphDeleteProjectControllerParams): Promise<GraphDeleteProjectControllerResponse> {
        const { id } = params;

        const response = await this.useCase.execute({ id });

        return {
            success: response.success,
            error: response.error
        };
    }
}

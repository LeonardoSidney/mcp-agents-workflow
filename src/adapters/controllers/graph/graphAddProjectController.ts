import type { GraphAddControllerParams, GraphAddControllerResponse, IGraphAddController } from '@domain/controllers/iGraphAddController.ts';
import type { IGraphAddUseCase } from '@domain/use-cases/iGraphAddUseCase.ts';

export class GraphAddController implements IGraphAddController {
    private readonly useCase: IGraphAddUseCase;

    constructor (
        useCase: IGraphAddUseCase
    ) {
        this.useCase = useCase;
    }

    async handle (params: GraphAddControllerParams): Promise<GraphAddControllerResponse> {
        const { name, description, status } = params;

        const response = await this.useCase.execute({ name, description, status });

        return {
            success: response.success,
            project: response.project,
            error: response.error
        };
    }
}

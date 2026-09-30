import type { Project } from '@domain/entities/project.ts';

export interface IGraphGetProjectUseCase {
    execute (params: GraphGetProjectUseCaseParams): Promise<GraphGetProjectUseCaseResponse>;
}

export type GraphGetProjectUseCaseParams = {
    id: string;
};

export type GraphGetProjectUseCaseResponse = {
    success: boolean;
    project?: Project;
    error?: string;
};

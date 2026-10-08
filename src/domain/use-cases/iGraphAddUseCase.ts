import type { Project } from '@domain/entities/project.ts';

export interface IGraphAddUseCase {
    execute (params: GraphAddUseCaseParams): Promise<GraphAddUseCaseResponse>;
}

export type GraphAddUseCaseParams = {
    name: string;
    description: string;
};

export type GraphAddUseCaseResponse = {
    success: boolean;
    project?: Project;
    error?: string;
};

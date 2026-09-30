import type { Project } from '@domain/entities/project.ts';

export interface IGraphGetProjectsUseCase {
    execute (): Promise<GraphGetProjectsUseCaseResponse>;
}

export type GraphGetProjectsUseCaseResponse = {
    success: boolean;
    projects?: Project[];
    error?: string;
};

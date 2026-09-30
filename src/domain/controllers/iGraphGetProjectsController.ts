import type { Project } from '@domain/entities/project.ts';

export interface IGraphGetProjectsController {
    handle (): Promise<GraphGetProjectsControllerResponse>;
}

export type GraphGetProjectsControllerResponse = {
    success: boolean;
    projects?: Project[];
    error?: string;
};

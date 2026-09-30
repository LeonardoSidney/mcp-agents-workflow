import type { Project } from '@domain/entities/project.ts';

export interface IGraphGetProjectController {
    handle (params: GraphGetProjectControllerParams): Promise<GraphGetProjectControllerResponse>;
}

export type GraphGetProjectControllerParams = {
    id: string;
};

export type GraphGetProjectControllerResponse = {
    success: boolean;
    project?: Project;
    error?: string;
};

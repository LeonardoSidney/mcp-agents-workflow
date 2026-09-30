import type { Status } from '@domain/constants/status.ts';
import type { Project } from '@domain/entities/project.ts';

export interface IGraphAddController {
    handle (params: GraphAddControllerParams): Promise<GraphAddControllerResponse>;
}

export type GraphAddControllerParams = {
    name: string;
    description: string;
    status: Status;
};

export type GraphAddControllerResponse = {
    success: boolean;
    project?: Project;
    error?: string;
};

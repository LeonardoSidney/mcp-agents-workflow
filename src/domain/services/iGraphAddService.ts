import type { Status } from '@domain/constants/status.ts';
import type { Project } from '@domain/entities/project.ts';

export interface IGraphAddService {
    mapProject (params: GraphAddServiceParams): GraphAddServiceResponse;
}

export type GraphAddServiceParams = {
    name: string;
    description: string;
    status: Status;
};

export type GraphAddServiceResponse = {
    success: boolean;
    project?: Project;
    error?: string;
};

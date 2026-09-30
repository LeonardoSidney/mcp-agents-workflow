import type { Status } from '@domain/constants/status.ts';
import type { Project } from '@domain/entities/project.ts';

export interface IGraphAddUseCase {
    execute (params: GraphAddUseCaseParams): Promise<GraphAddUseCaseResponse>;
}

export type GraphAddUseCaseParams = {
    name: string;
    description: string;
    status: Status;
};

export type GraphAddUseCaseResponse = {
    success: boolean;
    project?: Project;
    error?: string;
};

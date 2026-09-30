import type { Project } from '@domain/entities/project.ts';

export interface IProjectRepository {
    addProject (params: AddProjectRepositoryParams): Promise<void>;
}

export type AddProjectRepositoryParams = {
    project: Project;
};

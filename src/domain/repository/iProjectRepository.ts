import type { Project } from '@domain/entities/project.ts';

export interface IProjectRepository {
    addProject (params: AddProjectRepositoryParams): Promise<void>;
    getProjects (): Promise<Project[]>;
    getProject (params: GetProjectRepositoryParams): Promise<Project | null>;
    deleteProject (params: DeleteProjectRepositoryParams): Promise<boolean>;
}

export type AddProjectRepositoryParams = {
    project: Project;
};

export type GetProjectRepositoryParams = {
    id: string;
};

export type DeleteProjectRepositoryParams = {
    id: string;
};

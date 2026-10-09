import type { Project } from '@domain/entities/project.ts';

export interface IProjectRepository {
    addProject (params: AddProjectRepositoryParams): Promise<void>;
    getProjects (): Promise<Project[]>;
    getProject (params: GetProjectRepositoryParams): Promise<Project | null>;
    getProjectByName (params: GetProjectByNameRepositoryParams): Promise<Project | null>;
    deleteProject (params: DeleteProjectRepositoryParams): Promise<boolean>;
}

export type AddProjectRepositoryParams = {
    project: Project;
};

export type GetProjectRepositoryParams = {
    id: string;
};

export type GetProjectByNameRepositoryParams = {
    name: string;
};

export type DeleteProjectRepositoryParams = {
    id: string;
};

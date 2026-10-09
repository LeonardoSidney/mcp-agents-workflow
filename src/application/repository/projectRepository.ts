import type { AddProjectRepositoryParams, DeleteProjectRepositoryParams, GetProjectByNameRepositoryParams, GetProjectRepositoryParams, IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { Project } from '@domain/entities/project.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { ProjectDTO } from '@application/dto/projectDto.ts';

export class ProjectRepository implements IProjectRepository {
    private readonly databaseGateway: IDatabaseGateway;

    constructor (
        databaseGateway: IDatabaseGateway
    ) {
        this.databaseGateway = databaseGateway;
    }

    async addProject (params: AddProjectRepositoryParams): Promise<void> {
        const document = ProjectDTO.to_mongodb(params.project);

        await this.databaseGateway.addGraph({ project: document });
    }

    async getProjects (): Promise<Project[]> {
        const documents = await this.databaseGateway.listGraphs();

        return documents.map(document => ProjectDTO.to_domain(document));
    }

    async getProject (params: GetProjectRepositoryParams): Promise<Project | null> {
        const document = await this.databaseGateway.listGraph({ id: params.id });
        if (!document) {
            return null;
        }

        return ProjectDTO.to_domain(document);
    }

    async getProjectByName (params: GetProjectByNameRepositoryParams): Promise<Project | null> {
        const document = await this.databaseGateway.listGraphByName({ name: params.name });
        if (!document) {
            return null;
        }

        return ProjectDTO.to_domain(document);
    }

    async deleteProject (params: DeleteProjectRepositoryParams): Promise<boolean> {
        return this.databaseGateway.deleteGraph({ id: params.id });
    }
}

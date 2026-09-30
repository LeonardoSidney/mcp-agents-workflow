import type { AddProjectRepositoryParams, IProjectRepository } from '@domain/repository/iProjectRepository.ts';
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
}

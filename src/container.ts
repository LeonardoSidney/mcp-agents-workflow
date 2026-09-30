import { GraphAddController } from '@adapters/controllers/graph/graphAddProjectController.ts';
import { GraphDeleteProjectController } from '@adapters/controllers/graph/graphDeleteProjectController.ts';
import { GraphGetProjectController } from '@adapters/controllers/graph/graphGetProjectController.ts';
import { GraphGetProjectsController } from '@adapters/controllers/graph/graphGetProjectsController.ts';
import { ProjectRepository } from '@application/repository/projectRepository.ts';
import { GraphAddService } from '@application/services/graph/graphAddService.ts';
import { GraphAddUseCase } from '@application/use-cases/graph/graphAddUseCase.ts';
import { GraphDeleteProjectUseCase } from '@application/use-cases/graph/graphDeleteProjectUseCase.ts';
import { GraphGetProjectUseCase } from '@application/use-cases/graph/graphGetProjectUseCase.ts';
import { GraphGetProjectsUseCase } from '@application/use-cases/graph/graphGetProjectsUseCase.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { bootDatabase } from './boot.ts';

let databaseInstance: IDatabaseGateway | undefined;

export async function database (): Promise<IDatabaseGateway> {
    if (databaseInstance !== undefined) {
        return databaseInstance;
    }

    databaseInstance = await bootDatabase();
    return databaseInstance;
}

export async function graphAddController (): Promise<GraphAddController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const graphAddService = new GraphAddService();
    const graphAddUseCase = new GraphAddUseCase(graphAddService, projectRepository);

    return new GraphAddController(graphAddUseCase);
}

export async function graphGetProjectsController (): Promise<GraphGetProjectsController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const graphGetProjectsUseCase = new GraphGetProjectsUseCase(projectRepository);

    return new GraphGetProjectsController(graphGetProjectsUseCase);
}

export async function graphGetProjectController (): Promise<GraphGetProjectController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const graphGetProjectUseCase = new GraphGetProjectUseCase(projectRepository);

    return new GraphGetProjectController(graphGetProjectUseCase);
}

export async function graphDeleteProjectController (): Promise<GraphDeleteProjectController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const graphDeleteProjectUseCase = new GraphDeleteProjectUseCase(projectRepository);

    return new GraphDeleteProjectController(graphDeleteProjectUseCase);
}

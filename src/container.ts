import { GraphAddController } from '@adapters/controllers/graph/graphAddProjectController.ts';
import { ProjectRepository } from '@application/repository/projectRepository.ts';
import { GraphAddService } from '@application/services/graph/graphAddService.ts';
import { GraphAddUseCase } from '@application/use-cases/graph/graphAddUseCase.ts';
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

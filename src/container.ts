import { GraphAddEdgeController } from '@adapters/controllers/graph/graphAddEdgeController.ts';
import { GraphAddNodeController } from '@adapters/controllers/graph/graphAddNodeController.ts';
import { GraphAddController } from '@adapters/controllers/graph/graphAddProjectController.ts';
import { GraphDeleteEdgeController } from '@adapters/controllers/graph/graphDeleteEdgeController.ts';
import { GraphDeleteNodeController } from '@adapters/controllers/graph/graphDeleteNodeController.ts';
import { GraphDeleteProjectController } from '@adapters/controllers/graph/graphDeleteProjectController.ts';
import { GraphGetNodeController } from '@adapters/controllers/graph/graphGetNodeController.ts';
import { GraphGetNodesController } from '@adapters/controllers/graph/graphGetNodesController.ts';
import { GraphGetProjectController } from '@adapters/controllers/graph/graphGetProjectController.ts';
import { GraphGetProjectsController } from '@adapters/controllers/graph/graphGetProjectsController.ts';
import { GraphSearchNodesController } from '@adapters/controllers/graph/graphSearchNodesController.ts';
import { GraphAppendMemoController } from '@adapters/controllers/graph/graphAppendMemoController.ts';
import { GraphUpdateEdgeController } from '@adapters/controllers/graph/graphUpdateEdgeController.ts';
import { GraphUpdateNodeController } from '@adapters/controllers/graph/graphUpdateNodeController.ts';
import { ConsoleLogger } from '@adapters/logger/consoleLogger.ts';
import { EdgeRepository } from '@application/repository/edgeRepository.ts';
import { MemoRepository } from '@application/repository/memoRepository.ts';
import { NodeRepository } from '@application/repository/nodeRepository.ts';
import { ProjectRepository } from '@application/repository/projectRepository.ts';
import { GraphAddNodeService } from '@application/services/graph/graphAddNodeService.ts';
import { GraphAppendMemoService } from '@application/services/graph/graphAppendMemoService.ts';
import { GraphAddService } from '@application/services/graph/graphAddService.ts';
import { GraphEdgeService } from '@application/services/graph/graphEdgeService.ts';
import { GraphSearchNodesService } from '@application/services/graph/graphSearchNodesService.ts';
import { GraphUpdateNodeService } from '@application/services/graph/graphUpdateNodeService.ts';
import { GraphAddEdgeUseCase } from '@application/use-cases/graph/graphAddEdgeUseCase.ts';
import { GraphAddNodeUseCase } from '@application/use-cases/graph/graphAddNodeUseCase.ts';
import { GraphAppendMemoUseCase } from '@application/use-cases/graph/graphAppendMemoUseCase.ts';
import { GraphAddUseCase } from '@application/use-cases/graph/graphAddUseCase.ts';
import { GraphDeleteEdgeUseCase } from '@application/use-cases/graph/graphDeleteEdgeUseCase.ts';
import { GraphDeleteNodeUseCase } from '@application/use-cases/graph/graphDeleteNodeUseCase.ts';
import { GraphDeleteProjectUseCase } from '@application/use-cases/graph/graphDeleteProjectUseCase.ts';
import { GraphGetNodeUseCase } from '@application/use-cases/graph/graphGetNodeUseCase.ts';
import { GraphGetNodesUseCase } from '@application/use-cases/graph/graphGetNodesUseCase.ts';
import { GraphGetProjectUseCase } from '@application/use-cases/graph/graphGetProjectUseCase.ts';
import { GraphGetProjectsUseCase } from '@application/use-cases/graph/graphGetProjectsUseCase.ts';
import { GraphSearchNodesUseCase } from '@application/use-cases/graph/graphSearchNodesUseCase.ts';
import { GraphUpdateEdgeUseCase } from '@application/use-cases/graph/graphUpdateEdgeUseCase.ts';
import { GraphUpdateNodeUseCase } from '@application/use-cases/graph/graphUpdateNodeUseCase.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { bootDatabase } from './boot.ts';

let databaseInstance: IDatabaseGateway | undefined;
const logger = new ConsoleLogger();

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
    const graphAddUseCase = new GraphAddUseCase(logger, graphAddService, projectRepository);
    return new GraphAddController(logger, graphAddUseCase);
}

export async function graphGetProjectsController (): Promise<GraphGetProjectsController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const graphGetProjectsUseCase = new GraphGetProjectsUseCase(logger, projectRepository);
    return new GraphGetProjectsController(logger, graphGetProjectsUseCase);
}

export async function graphGetProjectController (): Promise<GraphGetProjectController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const graphGetProjectUseCase = new GraphGetProjectUseCase(logger, projectRepository);
    return new GraphGetProjectController(logger, graphGetProjectUseCase);
}

export async function graphDeleteProjectController (): Promise<GraphDeleteProjectController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const graphDeleteProjectUseCase = new GraphDeleteProjectUseCase(logger, projectRepository);
    return new GraphDeleteProjectController(logger, graphDeleteProjectUseCase);
}

export async function graphAddNodeController (): Promise<GraphAddNodeController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const nodeRepository = new NodeRepository(databaseGateway);
    const graphAddNodeService = new GraphAddNodeService();
    const graphAddNodeUseCase = new GraphAddNodeUseCase(logger, graphAddNodeService, projectRepository, nodeRepository);
    return new GraphAddNodeController(logger, graphAddNodeUseCase);
}

export async function graphUpdateNodeController (): Promise<GraphUpdateNodeController> {
    const databaseGateway = await database();
    const nodeRepository = new NodeRepository(databaseGateway);
    const graphUpdateNodeService = new GraphUpdateNodeService();
    const graphUpdateNodeUseCase = new GraphUpdateNodeUseCase(logger, graphUpdateNodeService, nodeRepository);
    return new GraphUpdateNodeController(logger, graphUpdateNodeUseCase);
}

export async function graphGetNodesController (): Promise<GraphGetNodesController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const nodeRepository = new NodeRepository(databaseGateway);
    const graphGetNodesUseCase = new GraphGetNodesUseCase(logger, projectRepository, nodeRepository);
    return new GraphGetNodesController(logger, graphGetNodesUseCase);
}

export async function graphGetNodeController (): Promise<GraphGetNodeController> {
    const databaseGateway = await database();
    const nodeRepository = new NodeRepository(databaseGateway);
    const graphGetNodeUseCase = new GraphGetNodeUseCase(logger, nodeRepository);
    return new GraphGetNodeController(logger, graphGetNodeUseCase);
}

export async function graphDeleteNodeController (): Promise<GraphDeleteNodeController> {
    const databaseGateway = await database();
    const nodeRepository = new NodeRepository(databaseGateway);
    const memoRepository = new MemoRepository(databaseGateway);
    const graphDeleteNodeUseCase = new GraphDeleteNodeUseCase(logger, nodeRepository, memoRepository);
    return new GraphDeleteNodeController(logger, graphDeleteNodeUseCase);
}

export async function graphAppendMemoController (): Promise<GraphAppendMemoController> {
    const databaseGateway = await database();
    const nodeRepository = new NodeRepository(databaseGateway);
    const memoRepository = new MemoRepository(databaseGateway);
    const graphAppendMemoService = new GraphAppendMemoService();
    const graphAppendMemoUseCase = new GraphAppendMemoUseCase(logger, graphAppendMemoService, nodeRepository, memoRepository);
    return new GraphAppendMemoController(logger, graphAppendMemoUseCase);
}

export async function graphSearchNodesController (): Promise<GraphSearchNodesController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const nodeRepository = new NodeRepository(databaseGateway);
    const graphSearchNodesService = new GraphSearchNodesService();
    const graphSearchNodesUseCase = new GraphSearchNodesUseCase(logger, graphSearchNodesService, projectRepository, nodeRepository);
    return new GraphSearchNodesController(logger, graphSearchNodesUseCase);
}

export async function graphAddEdgeController (): Promise<GraphAddEdgeController> {
    const databaseGateway = await database();
    const projectRepository = new ProjectRepository(databaseGateway);
    const nodeRepository = new NodeRepository(databaseGateway);
    const edgeRepository = new EdgeRepository(databaseGateway);
    const graphAddEdgeService = new GraphEdgeService();
    const graphAddEdgeUseCase = new GraphAddEdgeUseCase(logger, projectRepository, nodeRepository, edgeRepository, graphAddEdgeService);
    return new GraphAddEdgeController(logger, graphAddEdgeUseCase);
}

export async function graphUpdateEdgeController (): Promise<GraphUpdateEdgeController> {
    const databaseGateway = await database();
    const edgeRepository = new EdgeRepository(databaseGateway);
    const graphUpdateEdgeService = new GraphEdgeService();
    const graphUpdateEdgeUseCase = new GraphUpdateEdgeUseCase(logger, edgeRepository, graphUpdateEdgeService);
    return new GraphUpdateEdgeController(logger, graphUpdateEdgeUseCase);
}

export async function graphDeleteEdgeController (): Promise<GraphDeleteEdgeController> {
    const databaseGateway = await database();
    const edgeRepository = new EdgeRepository(databaseGateway);
    const graphDeleteEdgeUseCase = new GraphDeleteEdgeUseCase(logger, edgeRepository);
    return new GraphDeleteEdgeController(logger, graphDeleteEdgeUseCase);
}

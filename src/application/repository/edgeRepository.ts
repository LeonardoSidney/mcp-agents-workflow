import type { IEdgeRepository, AddEdgeRepositoryParams, DeleteEdgeRepositoryParams, GetEdgeRepositoryParams, ListEdgesBySourceRepositoryParams, ListEdgesByTargetRepositoryParams, UpdateEdgeRepositoryParams } from '@domain/repository/iEdgeRepository.ts';
import type { Edge } from '@domain/entities/edge.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { EdgeDTO } from '@application/dto/edgeDto.ts';

export class EdgeRepository implements IEdgeRepository {
    private readonly databaseGateway: IDatabaseGateway;

    constructor (
        databaseGateway: IDatabaseGateway
    ) {
        this.databaseGateway = databaseGateway;
    }

    async addEdge (params: AddEdgeRepositoryParams): Promise<void> {
        const edgeDocument = EdgeDTO.to_mongodb(params.edge);

        await this.databaseGateway.addEdge({ edge: edgeDocument });
    }

    async getEdge (params: GetEdgeRepositoryParams): Promise<Edge | null> {
        const document = await this.databaseGateway.listEdge({ id: params.id });
        if (!document) {
            return null;
        }

        return EdgeDTO.to_domain(document);
    }

    async updateEdge (params: UpdateEdgeRepositoryParams): Promise<boolean> {
        const edgeDocument = EdgeDTO.to_mongodb(params.edge);

        return this.databaseGateway.updateEdge({ edge: edgeDocument });
    }

    async deleteEdge (params: DeleteEdgeRepositoryParams): Promise<boolean> {
        return this.databaseGateway.deleteEdge({ graphId: params.graphId, id: params.id });
    }

    async listEdgesBySource (params: ListEdgesBySourceRepositoryParams): Promise<Edge[]> {
        const documents = await this.databaseGateway.listEdgesBySource({ graphId: params.graphId, sourceId: params.sourceId });

        return documents.map(document => EdgeDTO.to_domain(document));
    }

    async listEdgesByTarget (params: ListEdgesByTargetRepositoryParams): Promise<Edge[]> {
        const documents = await this.databaseGateway.listEdgesByTarget({ graphId: params.graphId, targetId: params.targetId });

        return documents.map(document => EdgeDTO.to_domain(document));
    }
}

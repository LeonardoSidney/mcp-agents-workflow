import type { INodeRepository, AddNodeRepositoryParams, DeleteNodeRepositoryParams, GetNodeRepositoryParams, GetNodesRepositoryParams, RemoveNodeLinksRepositoryParams, UpdateNodeRepositoryParams } from '@domain/repository/iNodeRepository.ts';
import type { Node } from '@domain/entities/node.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { NodeDTO } from '@application/dto/nodeDto.ts';

export class NodeRepository implements INodeRepository {
    private readonly databaseGateway: IDatabaseGateway;

    constructor (
        databaseGateway: IDatabaseGateway
    ) {
        this.databaseGateway = databaseGateway;
    }

    async addNode (params: AddNodeRepositoryParams): Promise<void> {
        const document = NodeDTO.to_mongodb(params.node);

        await this.databaseGateway.addNode({ node: document });
    }

    async getNode (params: GetNodeRepositoryParams): Promise<Node | null> {
        const document = await this.databaseGateway.listNode({ id: params.id });
        if (!document) {
            return null;
        }

        return NodeDTO.to_domain(document);
    }

    async getNodes (params: GetNodesRepositoryParams): Promise<Node[]> {
        const documents = await this.databaseGateway.listNodes({ graphId: params.graphId });

        return documents.map(document => NodeDTO.to_domain(document));
    }

    async updateNode (params: UpdateNodeRepositoryParams): Promise<boolean> {
        const document = NodeDTO.to_mongodb(params.node);

        return this.databaseGateway.updateNode({ node: document });
    }

    async deleteNode (params: DeleteNodeRepositoryParams): Promise<boolean> {
        return this.databaseGateway.deleteNode({ id: params.id });
    }

    async removeNodeLinks (params: RemoveNodeLinksRepositoryParams): Promise<void> {
        await this.databaseGateway.removeNodeLinks({ graphId: params.graphId, targetId: params.targetId });
    }
}

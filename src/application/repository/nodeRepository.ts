import type { INodeRepository, AddNodeRepositoryParams, DeleteNodeRepositoryParams, GetNodeRepositoryParams, GetNodesRepositoryParams, ListAttachedEdgeIdsRepositoryParams, UpdateNodeRepositoryParams } from '@domain/repository/iNodeRepository.ts';
import type { NodeWithEdges } from '@domain/entities/node.ts';
import type { EdgeReference } from '@domain/entities/edge.ts';
import { toEdgeReference } from '@domain/entities/edge.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { NodeDTO } from '@application/dto/nodeDto.ts';
import { EdgeDTO } from '@application/dto/edgeDto.ts';

export class NodeRepository implements INodeRepository {
    private readonly databaseGateway: IDatabaseGateway;

    constructor (
        databaseGateway: IDatabaseGateway
    ) {
        this.databaseGateway = databaseGateway;
    }

    async addNode (params: AddNodeRepositoryParams): Promise<void> {
        const nodeDocument = NodeDTO.to_mongodb(params.node);

        await this.databaseGateway.addNode({ node: nodeDocument });
    }

    async getNode (params: GetNodeRepositoryParams): Promise<NodeWithEdges | null> {
        const document = await this.databaseGateway.listNode({ id: params.id });
        if (!document) {
            return null;
        }

        const node = NodeDTO.to_domain(document);
        const edges = await this.edgesBySource(node.graphId, node.id);

        return { ...node, edges };
    }

    async getNodes (params: GetNodesRepositoryParams): Promise<NodeWithEdges[]> {
        const documents = await this.databaseGateway.listNodes({
            graphId: params.graphId,
            type: params.type,
            status: params.status,
            limit: params.limit
        });

        return Promise.all(documents.map(async document => {
            const node = NodeDTO.to_domain(document);
            const edges = await this.edgesBySource(node.graphId, node.id);

            return { ...node, edges };
        }));
    }

    async updateNode (params: UpdateNodeRepositoryParams): Promise<boolean> {
        const nodeDocument = NodeDTO.to_mongodb(params.node);

        return this.databaseGateway.updateNode({ node: nodeDocument });
    }

    async deleteNode (params: DeleteNodeRepositoryParams): Promise<boolean> {
        return this.databaseGateway.deleteNode({ id: params.id });
    }

    async listAttachedEdgeIds (params: ListAttachedEdgeIdsRepositoryParams): Promise<string[]> {
        const outgoing = await this.databaseGateway.listEdgesBySource({ graphId: params.graphId, sourceId: params.nodeId });
        const incoming = await this.databaseGateway.listEdgesByTarget({ graphId: params.graphId, targetId: params.nodeId });

        const attachedIds = [...outgoing, ...incoming].map(document => document.id);

        return attachedIds.filter((id, index) => attachedIds.indexOf(id) === index);
    }

    private async edgesBySource (graphId: string, sourceId: string): Promise<EdgeReference[]> {
        const documents = await this.databaseGateway.listEdgesBySource({ graphId, sourceId });

        return documents.map(document => toEdgeReference(EdgeDTO.to_domain(document)));
    }
}

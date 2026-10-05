import type { INodeRepository, AddNodeRepositoryParams, DeleteNodeRepositoryParams, GetNodeRepositoryParams, GetNodesRepositoryParams, ListReferencingNodeIdsRepositoryParams, UpdateNodeRepositoryParams } from '@domain/repository/iNodeRepository.ts';
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
        const edgeDocuments = params.edges.map(EdgeDTO.to_mongodb);

        await this.databaseGateway.addNodeWithEdges({ node: nodeDocument, edges: edgeDocuments });
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
        const edgeDocuments = params.edges ? params.edges.map(EdgeDTO.to_mongodb) : undefined;

        return this.databaseGateway.updateNodeWithEdges({ node: nodeDocument, edges: edgeDocuments });
    }

    async deleteNode (params: DeleteNodeRepositoryParams): Promise<boolean> {
        return this.databaseGateway.deleteNodeWithEdges({ id: params.id });
    }

    async listReferencingNodeIds (params: ListReferencingNodeIdsRepositoryParams): Promise<string[]> {
        const documents = await this.databaseGateway.listEdgesByTarget({ graphId: params.graphId, targetId: params.targetId });

        return documents.map(document => document.source_id);
    }

    private async edgesBySource (graphId: string, sourceId: string): Promise<EdgeReference[]> {
        const documents = await this.databaseGateway.listEdgesBySource({ graphId, sourceId });

        return documents.map(document => toEdgeReference(EdgeDTO.to_domain(document)));
    }
}

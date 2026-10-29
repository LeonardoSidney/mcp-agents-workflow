import type { INodeRepository, AddNodeRepositoryParams, DeleteNodeRepositoryParams, GetNodeRepositoryParams, GetNodesRepositoryParams, ListAttachedEdgeIdsRepositoryParams, RecordGetRepositoryParams, RecordSearchHitsRepositoryParams, UpdateNodeRepositoryParams } from '@domain/repository/iNodeRepository.ts';
import type { NodeWithEdges, NodeWithMemos } from '@domain/entities/node.ts';
import type { EdgeReference } from '@domain/entities/edge.ts';
import { toEdgeReference } from '@domain/entities/edge.ts';
import type { Memo } from '@domain/entities/memo.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { NodeDTO } from '@application/dto/nodeDto.ts';
import { EdgeDTO } from '@application/dto/edgeDto.ts';
import { MemoDTO } from '@application/dto/memoDto.ts';

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

    async getNode (params: GetNodeRepositoryParams): Promise<NodeWithMemos | null> {
        const document = await this.databaseGateway.listNode({ id: params.id });
        if (!document) {
            return null;
        }

        const node = NodeDTO.to_domain(document);
        const [edges, memos] = await Promise.all([
            this.edgesBySource(node.graphId, node.id),
            this.memosByNode(node.id)
        ]);

        return { ...node, edges, memos };
    }

    async getNodes (params: GetNodesRepositoryParams): Promise<NodeWithEdges[]> {
        const documents = await this.listNodeDocuments(params);

        return Promise.all(documents.map(async document => {
            const node = NodeDTO.to_domain(document);
            const edges = await this.edgesBySource(node.graphId, node.id);

            return { ...node, edges };
        }));
    }

    async getNodesWithMemos (params: GetNodesRepositoryParams): Promise<NodeWithMemos[]> {
        const documents = await this.listNodeDocuments(params);

        return Promise.all(documents.map(async document => {
            const node = NodeDTO.to_domain(document);
            const [edges, memos] = await Promise.all([
                this.edgesBySource(node.graphId, node.id),
                this.memosByNode(node.id)
            ]);

            return { ...node, edges, memos };
        }));
    }

    async updateNode (params: UpdateNodeRepositoryParams): Promise<boolean> {
        const nodeDocument = NodeDTO.to_mongodb(params.node);

        return this.databaseGateway.updateNode({ node: nodeDocument });
    }

    async deleteNode (params: DeleteNodeRepositoryParams): Promise<boolean> {
        return this.databaseGateway.deleteNode({ id: params.id });
    }

    async recordGet (params: RecordGetRepositoryParams): Promise<void> {
        await this.databaseGateway.recordNodeGet({ id: params.id });
    }

    async recordSearchHits (params: RecordSearchHitsRepositoryParams): Promise<void> {
        await this.databaseGateway.recordNodeSearchHits({ ids: params.ids });
    }

    async listAttachedEdgeIds (params: ListAttachedEdgeIdsRepositoryParams): Promise<string[]> {
        const outgoing = await this.databaseGateway.listEdgesBySource({ graphId: params.graphId, sourceId: params.nodeId });
        const incoming = await this.databaseGateway.listEdgesByTarget({ graphId: params.graphId, targetId: params.nodeId });

        const attachedIds = [...outgoing, ...incoming].map(document => document._id);

        return attachedIds.filter((id, index) => attachedIds.indexOf(id) === index);
    }

    private async edgesBySource (graphId: string, sourceId: string): Promise<EdgeReference[]> {
        const documents = await this.databaseGateway.listEdgesBySource({ graphId, sourceId });
        if (documents.length === 0) {
            return [];
        }

        const targetIds = documents.map(document => document.target_id);
        const uniqueTargetIds = targetIds.filter((id, index) => targetIds.indexOf(id) === index);
        const titlesByTargetId = await this.titlesByTargetId(graphId, uniqueTargetIds);

        return documents.map(document => {
            const reference = toEdgeReference(EdgeDTO.to_domain(document));
            const targetTitle = titlesByTargetId.get(document.target_id);
            if (targetTitle === undefined) {
                return reference;
            }

            return { ...reference, targetTitle };
        });
    }

    private async titlesByTargetId (graphId: string, targetIds: string[]): Promise<Map<string, string>> {
        const documents = await this.databaseGateway.listNodesByIds({ graphId, ids: targetIds });

        return new Map(documents.map(document => [document._id, document.title] as [string, string]));
    }

    private async memosByNode (nodeId: string): Promise<Memo[]> {
        const documents = await this.databaseGateway.listMemosByNode({ nodeId });

        return documents.map(document => MemoDTO.to_domain(document));
    }

    private async listNodeDocuments (params: GetNodesRepositoryParams) {
        return this.databaseGateway.listNodes({
            graphId: params.graphId,
            type: params.type,
            status: params.status,
            limit: params.limit
        });
    }
}

import type { Filter, MongoClient } from 'mongodb';
import type {
    AddEdgeGatewayParams,
    AddGraphGatewayParams,
    AddNodeGatewayParams,
    DeleteEdgeGatewayParams,
    DeleteGraphGatewayParams,
    DeleteNodeGatewayParams,
    IDatabaseGateway,
    ListEdgeGatewayParams,
    ListNodeGatewayParams,
    ListNodesGatewayParams,
    ListGraphGatewayParams,
    ListEdgesBySourceGatewayParams,
    ListEdgesByTargetGatewayParams,
    NodeDocument,
    EdgeDocument,
    ProjectDocument,
    UpdateEdgeGatewayParams,
    UpdateNodeGatewayParams
} from '@domain/gateways/iDatabaseGateway.ts';

export class MongoDBGateway implements IDatabaseGateway {
    private readonly client: MongoClient;

    constructor (
        client: MongoClient
    ) {
        this.client = client;
    }

    async addGraph (params: AddGraphGatewayParams): Promise<void> {
        const collection = this.client.db().collection<ProjectDocument>('projects');

        await collection.insertOne(params.project);
    }

    async listGraphs (): Promise<ProjectDocument[]> {
        const collection = this.client.db().collection<ProjectDocument>('projects');

        return collection.find({}).toArray();
    }

    async listGraph (params: ListGraphGatewayParams): Promise<ProjectDocument | null> {
        const collection = this.client.db().collection<ProjectDocument>('projects');

        return collection.findOne({ id: params.id });
    }

    async deleteGraph (params: DeleteGraphGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<ProjectDocument>('projects');

        const result = await collection.deleteOne({ id: params.id });

        return result.deletedCount > 0;
    }

    async addNode (params: AddNodeGatewayParams): Promise<void> {
        const collection = this.client.db().collection<NodeDocument>('nodes');

        await collection.insertOne(params.node);
    }

    async updateNode (params: UpdateNodeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<NodeDocument>('nodes');
        const node = params.node;

        const update = {
            $set: {
                status: node.status,
                title: node.title,
                description: node.description,
                updated_at: node.updated_at
            }
        };

        const result = await collection.updateOne({ id: node.id }, update);

        return result.matchedCount > 0;
    }

    async listNode (params: ListNodeGatewayParams): Promise<NodeDocument | null> {
        const collection = this.client.db().collection<NodeDocument>('nodes');

        return collection.findOne({ id: params.id });
    }

    async listNodes (params: ListNodesGatewayParams): Promise<NodeDocument[]> {
        const collection = this.client.db().collection<NodeDocument>('nodes');
        const filter: Filter<NodeDocument> = { graph_id: params.graphId };

        if (params.type) {
            filter.type = params.type;
        }

        if (params.status) {
            filter.status = params.status;
        }

        const cursor = collection.find(filter).sort({ updated_at: -1 });
        if (params.limit) {
            return cursor.limit(params.limit).toArray();
        }

        return cursor.toArray();
    }

    async deleteNode (params: DeleteNodeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<NodeDocument>('nodes');

        const result = await collection.deleteOne({ id: params.id });

        return result.deletedCount > 0;
    }

    async addEdge (params: AddEdgeGatewayParams): Promise<void> {
        const collection = this.client.db().collection<EdgeDocument>('edges');

        await collection.insertOne(params.edge);
    }

    async updateEdge (params: UpdateEdgeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<EdgeDocument>('edges');
        const edge = params.edge;

        const update = {
            $set: {
                type: edge.type,
                description: edge.description
            }
        };

        const result = await collection.updateOne({ id: edge.id }, update);

        return result.matchedCount > 0;
    }

    async listEdge (params: ListEdgeGatewayParams): Promise<EdgeDocument | null> {
        const collection = this.client.db().collection<EdgeDocument>('edges');

        return collection.findOne({ id: params.id });
    }

    async deleteEdge (params: DeleteEdgeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<EdgeDocument>('edges');

        const result = await collection.deleteOne({ graph_id: params.graphId, id: params.id });

        return result.deletedCount > 0;
    }

    async listEdgesBySource (params: ListEdgesBySourceGatewayParams): Promise<EdgeDocument[]> {
        const collection = this.client.db().collection<EdgeDocument>('edges');

        return collection
            .find({ graph_id: params.graphId, source_id: params.sourceId })
            .toArray();
    }

    async listEdgesByTarget (params: ListEdgesByTargetGatewayParams): Promise<EdgeDocument[]> {
        const collection = this.client.db().collection<EdgeDocument>('edges');

        return collection
            .find({ graph_id: params.graphId, target_id: params.targetId })
            .toArray();
    }
}

import type { Filter, MongoClient } from 'mongodb';
import type {
    AddGraphGatewayParams,
    AddNodeWithEdgesGatewayParams,
    DeleteGraphGatewayParams,
    DeleteNodeGatewayParams,
    IDatabaseGateway,
    ListNodeGatewayParams,
    ListNodesGatewayParams,
    ListGraphGatewayParams,
    ListEdgesBySourceGatewayParams,
    ListEdgesByTargetGatewayParams,
    NodeDocument,
    EdgeDocument,
    ProjectDocument,
    UpdateNodeWithEdgesGatewayParams
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

    async addNodeWithEdges (params: AddNodeWithEdgesGatewayParams): Promise<void> {
        const { node, edges } = params;

        await this.client.withSession(session => session.withTransaction(async () => {
            const nodes = this.client.db().collection<NodeDocument>('nodes');
            const edgeCollection = this.client.db().collection<EdgeDocument>('edges');

            await nodes.insertOne(node, { session });

            if (edges.length > 0) {
                await edgeCollection.insertMany(edges, { session });
            }
        }));
    }

    async updateNodeWithEdges (params: UpdateNodeWithEdgesGatewayParams): Promise<boolean> {
        const { node, edges } = params;
        const nodeCollection = this.client.db().collection<NodeDocument>('nodes');

        const update = {
            $set: {
                status: node.status,
                title: node.title,
                description: node.description,
                updated_at: node.updated_at
            }
        };

        if (edges === undefined) {
            const result = await nodeCollection.updateOne({ id: node.id }, update);

            return result.matchedCount > 0;
        }

        const edgeCollection = this.client.db().collection<EdgeDocument>('edges');

        return this.client.withSession(session => session.withTransaction(async (): Promise<boolean> => {
            const result = await nodeCollection.updateOne({ id: node.id }, update, { session });
            if (result.matchedCount === 0) {
                return false;
            }

            await edgeCollection.deleteMany({ graph_id: node.graph_id, source_id: node.id }, { session });
            if (edges.length > 0) {
                await edgeCollection.insertMany(edges, { session });
            }

            return true;
        }));
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

    async deleteNodeWithEdges (params: DeleteNodeGatewayParams): Promise<boolean> {
        return this.client.withSession(session => session.withTransaction(async (): Promise<boolean> => {
            const nodes = this.client.db().collection<NodeDocument>('nodes');
            const edgeCollection = this.client.db().collection<EdgeDocument>('edges');

            const result = await nodes.deleteOne({ id: params.id }, { session });
            if (result.deletedCount === 0) {
                return false;
            }

            await edgeCollection.deleteMany({ source_id: params.id }, { session });

            return true;
        }));
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

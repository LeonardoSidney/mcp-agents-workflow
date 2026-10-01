import type { Db, Filter } from 'mongodb';
import type {
    AddGraphGatewayParams,
    AddNodeGatewayParams,
    DeleteGraphGatewayParams,
    DeleteNodeGatewayParams,
    IDatabaseGateway,
    ListNodeGatewayParams,
    ListNodesGatewayParams,
    ListGraphGatewayParams,
    NodeDocument,
    ProjectDocument,
    RemoveNodeLinksGatewayParams,
    UpdateNodeGatewayParams
} from '@domain/gateways/iDatabaseGateway.ts';

export class MongoDBGateway implements IDatabaseGateway {
    private readonly database: Db;

    constructor (
        database: Db
    ) {
        this.database = database;
    }

    async addGraph (params: AddGraphGatewayParams): Promise<void> {
        const collection = this.database.collection<ProjectDocument>('projects');

        await collection.insertOne(params.project);
    }

    async listGraphs (): Promise<ProjectDocument[]> {
        const collection = this.database.collection<ProjectDocument>('projects');

        return collection.find({}).toArray();
    }

    async listGraph (params: ListGraphGatewayParams): Promise<ProjectDocument | null> {
        const collection = this.database.collection<ProjectDocument>('projects');

        return collection.findOne({ id: params.id });
    }

    async deleteGraph (params: DeleteGraphGatewayParams): Promise<boolean> {
        const collection = this.database.collection<ProjectDocument>('projects');

        const result = await collection.deleteOne({ id: params.id });

        return result.deletedCount > 0;
    }

    async addNode (params: AddNodeGatewayParams): Promise<void> {
        const collection = this.database.collection<NodeDocument>('nodes');

        await collection.insertOne(params.node);
    }

    async updateNode (params: UpdateNodeGatewayParams): Promise<boolean> {
        const collection = this.database.collection<NodeDocument>('nodes');
        const { node } = params;

        const result = await collection.updateOne(
            { id: node.id },
            {
                $set: {
                    status: node.status,
                    title: node.title,
                    description: node.description,
                    links: node.links,
                    updated_at: node.updated_at
                }
            }
        );

        return result.matchedCount > 0;
    }

    async listNode (params: ListNodeGatewayParams): Promise<NodeDocument | null> {
        const collection = this.database.collection<NodeDocument>('nodes');

        return collection.findOne({ id: params.id });
    }

    async listNodes (params: ListNodesGatewayParams): Promise<NodeDocument[]> {
        const collection = this.database.collection<NodeDocument>('nodes');
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
        const collection = this.database.collection<NodeDocument>('nodes');

        const result = await collection.deleteOne({ id: params.id });

        return result.deletedCount > 0;
    }

    async removeNodeLinks (params: RemoveNodeLinksGatewayParams): Promise<void> {
        const collection = this.database.collection<NodeDocument>('nodes');
        const now = new Date();

        await collection.updateMany(
            { graph_id: params.graphId, links: { $elemMatch: { targetId: params.targetId } } },
            {
                $pull: { links: { targetId: params.targetId } },
                $set: { updated_at: now }
            }
        );
    }
}

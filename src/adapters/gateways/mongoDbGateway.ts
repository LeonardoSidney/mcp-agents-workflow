import type { Db } from 'mongodb';
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
    RemoveNodeLinksGatewayParams
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

    async listNode (params: ListNodeGatewayParams): Promise<NodeDocument | null> {
        const collection = this.database.collection<NodeDocument>('nodes');

        return collection.findOne({ id: params.id });
    }

    async listNodes (params: ListNodesGatewayParams): Promise<NodeDocument[]> {
        const collection = this.database.collection<NodeDocument>('nodes');

        return collection
            .find({ graph_id: params.graphId })
            .sort({ updated_at: -1 })
            .toArray();
    }

    async deleteNode (params: DeleteNodeGatewayParams): Promise<boolean> {
        const collection = this.database.collection<NodeDocument>('nodes');

        const result = await collection.deleteOne({ id: params.id });

        return result.deletedCount > 0;
    }

    async removeNodeLinks (params: RemoveNodeLinksGatewayParams): Promise<void> {
        const collection = this.database.collection<NodeDocument>('nodes');

        await collection.updateMany(
            { graph_id: params.graphId },
            { $pull: { links: { targetId: params.targetId } } }
        );
    }
}

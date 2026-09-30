import type { Db } from 'mongodb';
import type { AddGraphGatewayParams, DeleteGraphGatewayParams, IDatabaseGateway, ListGraphGatewayParams, ProjectDocument } from '@domain/gateways/iDatabaseGateway.ts';

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
}

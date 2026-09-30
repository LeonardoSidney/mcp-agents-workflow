import type { Db } from 'mongodb';
import type { AddGraphGatewayParams, IDatabaseGateway, ProjectDocument } from '@domain/gateways/iDatabaseGateway.ts';

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
}

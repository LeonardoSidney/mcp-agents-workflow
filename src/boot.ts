import { MongoClient } from 'mongodb';
import { MongoDBGateway } from '@adapters/gateways/mongoDbGateway.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';

let client: MongoClient | undefined;

export async function bootDatabase (): Promise<IDatabaseGateway> {
    const uri = process.env['MONGODB_URI'];
    if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set');
    }

    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }

    return new MongoDBGateway(client);
}

export async function shutdownDatabase (): Promise<void> {
    if (!client) {
        return;
    }

    await client.close();
    client = undefined;
}

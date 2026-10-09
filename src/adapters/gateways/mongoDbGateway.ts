import { ObjectId } from 'mongodb';
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
    ListGraphByNameGatewayParams,
    ListEdgesBySourceGatewayParams,
    ListEdgesByTargetGatewayParams,
    NodeDocument,
    EdgeDocument,
    MemoDocument,
    ProjectDocument,
    UpdateEdgeGatewayParams,
    UpdateNodeGatewayParams,
    AddMemoGatewayParams,
    ListMemosByNodeGatewayParams,
    DeleteMemosByNodeGatewayParams
} from '@domain/gateways/iDatabaseGateway.ts';

export type RawProjectDocument = {
    _id: ObjectId;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
};

export type RawNodeDocument = {
    _id: ObjectId;
    graph_id: string;
    type: string;
    status: string;
    title: string;
    description: string;
    created_at: Date;
    updated_at: Date;
};

export type RawEdgeDocument = {
    _id: ObjectId;
    graph_id: string;
    source_id: string;
    target_id: string;
    type: string;
    description?: string;
};

export type RawMemoDocument = {
    _id: ObjectId;
    node_id: string;
    author: string;
    text: string;
    created_at: Date;
};

export class MongoDBGateway implements IDatabaseGateway {
    private readonly client: MongoClient;

    constructor (
        client: MongoClient
    ) {
        this.client = client;
    }

    async addGraph (params: AddGraphGatewayParams): Promise<void> {
        const collection = this.client.db().collection<RawProjectDocument>('projects');

        await collection.insertOne(this.toRawProject(params.project));
    }

    async listGraphs (): Promise<ProjectDocument[]> {
        const collection = this.client.db().collection<RawProjectDocument>('projects');

        const documents = await collection.find({}).toArray();

        return documents.map(document => this.fromRawProject(document));
    }

    async listGraph (params: ListGraphGatewayParams): Promise<ProjectDocument | null> {
        const collection = this.client.db().collection<RawProjectDocument>('projects');

        const document = await collection.findOne({ _id: new ObjectId(params.id) });
        if (!document) {
            return null;
        }

        return this.fromRawProject(document);
    }

    async listGraphByName (params: ListGraphByNameGatewayParams): Promise<ProjectDocument | null> {
        const collection = this.client.db().collection<RawProjectDocument>('projects');

        const document = await collection.findOne({ name: params.name });
        if (!document) {
            return null;
        }

        return this.fromRawProject(document);
    }

    async deleteGraph (params: DeleteGraphGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<RawProjectDocument>('projects');

        const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

        return result.deletedCount > 0;
    }

    async addNode (params: AddNodeGatewayParams): Promise<void> {
        const collection = this.client.db().collection<RawNodeDocument>('nodes');

        await collection.insertOne(this.toRawNode(params.node));
    }

    async updateNode (params: UpdateNodeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<RawNodeDocument>('nodes');
        const node = params.node;

        const update = {
            $set: {
                status: node.status,
                title: node.title,
                description: node.description,
                updated_at: node.updated_at
            }
        };

        const result = await collection.updateOne({ _id: new ObjectId(node._id) }, update);

        return result.matchedCount > 0;
    }

    async listNode (params: ListNodeGatewayParams): Promise<NodeDocument | null> {
        const collection = this.client.db().collection<RawNodeDocument>('nodes');

        const document = await collection.findOne({ _id: new ObjectId(params.id) });
        if (!document) {
            return null;
        }

        return this.fromRawNode(document);
    }

    async listNodes (params: ListNodesGatewayParams): Promise<NodeDocument[]> {
        const collection = this.client.db().collection<RawNodeDocument>('nodes');
        const filter: Filter<RawNodeDocument> = { graph_id: params.graphId };

        if (params.type) {
            filter.type = params.type;
        }

        if (params.status) {
            filter.status = params.status;
        }

        const cursor = collection.find(filter).sort({ updated_at: -1 });
        const rawDocuments = params.limit
            ? await cursor.limit(params.limit).toArray()
            : await cursor.toArray();

        return rawDocuments.map(document => this.fromRawNode(document));
    }

    async deleteNode (params: DeleteNodeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<RawNodeDocument>('nodes');

        const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

        return result.deletedCount > 0;
    }

    async addEdge (params: AddEdgeGatewayParams): Promise<void> {
        const collection = this.client.db().collection<RawEdgeDocument>('edges');

        await collection.insertOne(this.toRawEdge(params.edge));
    }

    async updateEdge (params: UpdateEdgeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<RawEdgeDocument>('edges');
        const edge = params.edge;

        const update = {
            $set: {
                type: edge.type,
                description: edge.description
            }
        };

        const result = await collection.updateOne({ _id: new ObjectId(edge._id) }, update);

        return result.matchedCount > 0;
    }

    async listEdge (params: ListEdgeGatewayParams): Promise<EdgeDocument | null> {
        const collection = this.client.db().collection<RawEdgeDocument>('edges');

        const document = await collection.findOne({ _id: new ObjectId(params.id) });
        if (!document) {
            return null;
        }

        return this.fromRawEdge(document);
    }

    async deleteEdge (params: DeleteEdgeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<RawEdgeDocument>('edges');

        const result = await collection.deleteOne({ graph_id: params.graphId, _id: new ObjectId(params.id) });

        return result.deletedCount > 0;
    }

    async listEdgesBySource (params: ListEdgesBySourceGatewayParams): Promise<EdgeDocument[]> {
        const collection = this.client.db().collection<RawEdgeDocument>('edges');

        const documents = await collection
            .find({ graph_id: params.graphId, source_id: params.sourceId })
            .toArray();

        return documents.map(document => this.fromRawEdge(document));
    }

    async listEdgesByTarget (params: ListEdgesByTargetGatewayParams): Promise<EdgeDocument[]> {
        const collection = this.client.db().collection<RawEdgeDocument>('edges');

        const documents = await collection
            .find({ graph_id: params.graphId, target_id: params.targetId })
            .toArray();

        return documents.map(document => this.fromRawEdge(document));
    }

    async addMemo (params: AddMemoGatewayParams): Promise<void> {
        const collection = this.client.db().collection<RawMemoDocument>('memos');

        await collection.insertOne(this.toRawMemo(params.memo));
    }

    async listMemosByNode (params: ListMemosByNodeGatewayParams): Promise<MemoDocument[]> {
        const collection = this.client.db().collection<RawMemoDocument>('memos');

        const documents = await collection
            .find({ node_id: params.nodeId })
            .sort({ created_at: 1 })
            .toArray();

        return documents.map(document => this.fromRawMemo(document));
    }

    async deleteMemosByNode (params: DeleteMemosByNodeGatewayParams): Promise<boolean> {
        const collection = this.client.db().collection<RawMemoDocument>('memos');

        const result = await collection.deleteMany({ node_id: params.nodeId });

        return result.deletedCount > 0;
    }

    private toRawProject (document: ProjectDocument): RawProjectDocument {
        const { _id, ...rest } = document;

        return { _id: new ObjectId(_id), ...rest };
    }

    private fromRawProject (document: RawProjectDocument): ProjectDocument {
        const { _id, ...rest } = document;

        return { _id: _id.toHexString(), ...rest };
    }

    private toRawNode (document: NodeDocument): RawNodeDocument {
        const { _id, ...rest } = document;

        return { _id: new ObjectId(_id), ...rest };
    }

    private fromRawNode (document: RawNodeDocument): NodeDocument {
        const { _id, ...rest } = document;

        return { _id: _id.toHexString(), ...rest };
    }

    private toRawEdge (document: EdgeDocument): RawEdgeDocument {
        const { _id, ...rest } = document;

        return { _id: new ObjectId(_id), ...rest };
    }

    private fromRawEdge (document: RawEdgeDocument): EdgeDocument {
        const { _id, ...rest } = document;

        return { _id: _id.toHexString(), ...rest };
    }

    private toRawMemo (document: MemoDocument): RawMemoDocument {
        const { _id, ...rest } = document;

        return { _id: new ObjectId(_id), ...rest };
    }

    private fromRawMemo (document: RawMemoDocument): MemoDocument {
        const { _id, ...rest } = document;

        return { _id: _id.toHexString(), ...rest };
    }
}

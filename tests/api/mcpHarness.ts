import { Client, InMemoryTransport, type CallToolResult, type Tool } from '@modelcontextprotocol/client';
import { MongoClient, type Collection } from 'mongodb';
import type { McpServer } from '@modelcontextprotocol/server';
import type { NodeSummary, NodeWithMemos } from '@domain/entities/node.ts';
import type { Edge } from '@domain/entities/edge.ts';
import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { Memo } from '@domain/entities/memo.ts';
import type { Project } from '@domain/entities/project.ts';
import type { RawEdgeDocument, RawMemoDocument, RawNodeDocument, RawProjectDocument } from '@adapters/gateways/mongoDbGateway.ts';
import { shutdownDatabase } from '@src/boot.ts';
import { createServer } from '@src/mcpServer.ts';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/mcp-agents-workflow-test';
const OBJECT_ID_REGEX = /[0-9a-f]{24}/i;

export function mcpTestHarness () {
    const mongoClient = new MongoClient(MONGODB_URI);
    const projectsCollection: Collection<RawProjectDocument> = mongoClient.db().collection('projects');
    const nodesCollection: Collection<RawNodeDocument> = mongoClient.db().collection('nodes');
    const edgesCollection: Collection<RawEdgeDocument> = mongoClient.db().collection('edges');
    const memosCollection: Collection<RawMemoDocument> = mongoClient.db().collection('memos');

    let server: McpServer | undefined;
    let client: Client | undefined;

    beforeAll(async () => {
        process.env['MONGODB_URI'] = MONGODB_URI;
        await mongoClient.connect();
    });

    afterAll(async () => {
        await nodesCollection.deleteMany({});
        await edgesCollection.deleteMany({});
        await memosCollection.deleteMany({});
        await projectsCollection.deleteMany({});
        await shutdownDatabase();
        await mongoClient.close();
    });

    beforeEach(async () => {
        await nodesCollection.deleteMany({});
        await edgesCollection.deleteMany({});
        await memosCollection.deleteMany({});
        await projectsCollection.deleteMany({});

        const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();

        server = createServer();
        await server.connect(serverTransport);

        client = new Client({ name: 'mcp-agents-workflow-spec', version: '1.0.0' }, {});
        await client.connect(clientTransport);
    });

    afterEach(async () => {
        await client?.close();
        await server?.close();
        client = undefined;
        server = undefined;
    });

    async function callTool (name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> {
        if (!client) {
            throw new Error('MCP client is not connected');
        }

        try {
            return await client.callTool({ name, arguments: args });
        } catch {
            return { content: [{ type: 'text', text: `Protocol error calling ${name}` }], isError: true };
        }
    }

    function textOf (result: CallToolResult): string {
        return result.content
            .map(block => (block.type === 'text' ? block.text : ''))
            .join('');
    }

    function idOf (result: CallToolResult): string {
        const match = textOf(result).match(OBJECT_ID_REGEX);
        if (!match) {
            throw new Error(`No 24-hex ObjectId in tool response: ${textOf(result)}`);
        }

        return match[0];
    }

    function instructions (): string {
        const advertised = client?.getInstructions();
        if (!advertised) {
            throw new Error('MCP client is not connected or the server sent no instructions');
        }

        return advertised;
    }

    async function listTools (): Promise<{ tools: Tool[]; }> {
        if (!client) {
            throw new Error('MCP client is not connected');
        }

        return client.listTools();
    }

    async function addProject (name: string, description: string): Promise<Project> {
        const result = await callTool('graph-add', { name, description });

        if (result.isError) {
            const message = textOf(result);
            throw new Error(`graph-add failed: ${message}`);
        }

        const id = idOf(result);
        const fetched = await callTool('graph-get-project', { id });

        if (fetched.isError) {
            const message = textOf(fetched);
            throw new Error(`graph-get-project after graph-add failed: ${message}`);
        }

        return JSON.parse(textOf(fetched)) as Project;
    }

    async function addNode (
        graphId: string,
        type: string,
        title: string,
        description: string
    ): Promise<NodeSummary> {
        const result = await callTool('graph-add-node', {
            graphId,
            type,
            title,
            description,
            status: 'pending'
        });

        if (result.isError) {
            const message = textOf(result);
            throw new Error(`graph-add-node failed: ${message}`);
        }

        const id = idOf(result);
        const fetched = await callTool('graph-get-node', { id });

        if (fetched.isError) {
            const message = textOf(fetched);
            throw new Error(`graph-get-node after graph-add-node failed: ${message}`);
        }

        return JSON.parse(textOf(fetched)) as NodeSummary;
    }

    async function addEdge (
        graphId: string,
        sourceId: string,
        targetId: string,
        type: string,
        description?: string
    ): Promise<Edge> {
        const result = await callTool('graph-add-edge', {
            graphId,
            sourceId,
            targetId,
            type,
            ...(description ? { description } : {})
        });

        if (result.isError) {
            const message = textOf(result);
            throw new Error(`graph-add-edge failed: ${message}`);
        }

        const edge: Edge = {
            id: idOf(result),
            graphId,
            sourceId,
            targetId,
            type: type as EdgeType
        };

        if (description !== undefined) {
            edge.description = description;
        }

        return edge;
    }

    async function fetchProject (id: string): Promise<CallToolResult> {
        return callTool('graph-get-project', { id });
    }

    async function fetchNode (id: string): Promise<CallToolResult> {
        return callTool('graph-get-node', { id });
    }

    async function addMemo (nodeId: string, author: string, text: string): Promise<Memo> {
        const result = await callTool('graph-append-memo', { id: nodeId, author, text });

        if (result.isError) {
            const message = textOf(result);
            throw new Error(`graph-append-memo failed: ${message}`);
        }

        const id = idOf(result);
        const fetched = await callTool('graph-get-node', { id: nodeId });

        if (fetched.isError) {
            const message = textOf(fetched);
            throw new Error(`graph-get-node after graph-append-memo failed: ${message}`);
        }

        const node = JSON.parse(textOf(fetched)) as NodeWithMemos;
        const memo = node.memos.find(candidate => candidate.id === id);
        if (!memo) {
            throw new Error(`graph-get-node did not return the appended memo: ${id}`);
        }

        return memo;
    }

    return {
        callTool,
        textOf,
        instructions,
        listTools,
        addProject,
        addNode,
        addEdge,
        addMemo,
        fetchProject,
        fetchNode,
        projectsCollection,
        nodesCollection,
        edgesCollection,
        memosCollection
    };
}

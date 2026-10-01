import { Client, InMemoryTransport, type CallToolResult } from '@modelcontextprotocol/client';
import { MongoClient, type Collection } from 'mongodb';
import type { McpServer } from '@modelcontextprotocol/server';
import type { Node, NodeLink } from '@domain/entities/node.ts';
import type { Project } from '@domain/entities/project.ts';
import type { NodeDocument, ProjectDocument } from '@domain/gateways/iDatabaseGateway.ts';
import { shutdownDatabase } from '@src/boot.ts';
import { createServer } from '@src/mcpServer.ts';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/mcp-agents-workflow-test';
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function mcpTestHarness () {
    const mongoClient = new MongoClient(MONGODB_URI);
    const projectsCollection: Collection<ProjectDocument> = mongoClient.db().collection('projects');
    const nodesCollection: Collection<NodeDocument> = mongoClient.db().collection('nodes');

    let server: McpServer | undefined;
    let client: Client | undefined;

    beforeAll(async () => {
        process.env['MONGODB_URI'] = MONGODB_URI;
        await mongoClient.connect();
    });

    afterAll(async () => {
        await nodesCollection.deleteMany({});
        await projectsCollection.deleteMany({});
        await shutdownDatabase();
        await mongoClient.close();
    });

    beforeEach(async () => {
        await nodesCollection.deleteMany({});
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

    async function addProject (name: string, description: string, status?: string): Promise<Project> {
        const result = await callTool('graph-add', { name, description, ...(status ? { status } : {}) });

        if (result.isError) {
            const message = textOf(result);
            throw new Error(`graph-add failed: ${message}`);
        }

        const jsonStart = textOf(result).indexOf('{');
        const parsed = JSON.parse(textOf(result).slice(jsonStart)) as Project;
        if (!parsed.id.match(UUID_V4_REGEX)) {
            throw new Error(`graph-add did not return a uuidv4 id: ${parsed.id}`);
        }

        return parsed;
    }

    async function addNode (
        graphId: string,
        type: string,
        title: string,
        description: string,
        links: NodeLink[] = []
    ): Promise<Node> {
        const result = await callTool('graph-add-node', {
            graphId,
            type,
            title,
            description,
            status: 'pending',
            links
        });

        if (result.isError) {
            const message = textOf(result);
            throw new Error(`graph-add-node failed: ${message}`);
        }

        const jsonStart = textOf(result).indexOf('{');
        const parsed = JSON.parse(textOf(result).slice(jsonStart)) as Node;
        if (!parsed.id.match(UUID_V4_REGEX)) {
            throw new Error(`graph-add-node did not return a uuidv4 id: ${parsed.id}`);
        }

        return parsed;
    }

    async function fetchProject (id: string): Promise<CallToolResult> {
        return callTool('graph-get-project', { id });
    }

    async function fetchNode (id: string): Promise<CallToolResult> {
        return callTool('graph-get-node', { id });
    }

    return {
        callTool,
        textOf,
        addProject,
        addNode,
        fetchProject,
        fetchNode,
        projectsCollection,
        nodesCollection
    };
}

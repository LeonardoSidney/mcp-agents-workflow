import { Client, InMemoryTransport, type CallToolResult } from '@modelcontextprotocol/client';
import { MongoClient, type Collection } from 'mongodb';
import type { McpServer } from '@modelcontextprotocol/server';
import { shutdownDatabase } from '@src/boot.ts';
import { createServer } from '@src/index.ts';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/mcp-agents-workflow-test';

type StoredProjectDocument = {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: Date;
    updated_at: Date;
};

const mongoClient = new MongoClient(MONGODB_URI);
const projectsCollection: Collection<StoredProjectDocument> = mongoClient.db().collection('projects');

let server: McpServer | undefined;
let client: Client | undefined;

beforeAll(async () => {
    process.env['MONGODB_URI'] = MONGODB_URI;
    await mongoClient.connect();
});

afterAll(async () => {
    await projectsCollection.deleteMany({});
    await shutdownDatabase();
    await mongoClient.close();
});

beforeEach(async () => {
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

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AddedProject = { id: string; };

async function addProject (name: string, description: string, status?: string): Promise<AddedProject> {
    const result = await callTool('graph-add', { name, description, ...(status ? { status } : {}) });

    if (result.isError) {
        const message = textOf(result);
        throw new Error(`graph-add failed: ${message}`);
    }

    const jsonStart = textOf(result).indexOf('{');
    const parsed = JSON.parse(textOf(result).slice(jsonStart)) as AddedProject;
    if (!parsed.id.match(UUID_V4_REGEX)) {
        throw new Error(`graph-add did not return a uuidv4 id: ${parsed.id}`);
    }

    return parsed;
}

async function fetchProject (id: string): Promise<CallToolResult> {
    return callTool('graph-get-project', { id });
}

describe('MCP server - project lifecycle', () => {
    test('creates two projects', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        const second = await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

        expect(first.id).not.toEqual(second.id);

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(2);
        expect(saved.map(document => document.name)).toEqual(
            expect.arrayContaining(['First Project', 'Second Project'])
        );
    });

    test('lists both inserted projects by the returned uuidv4', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        const second = await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

        const firstResult = await fetchProject(first.id);
        const secondResult = await fetchProject(second.id);

        expect(firstResult.isError).toBeFalsy();
        expect(secondResult.isError).toBeFalsy();

        const firstProject = JSON.parse(textOf(firstResult)) as AddedProject & { name: string; };
        const secondProject = JSON.parse(textOf(secondResult)) as AddedProject & { name: string; };

        expect(firstProject).toMatchObject({ id: first.id, name: 'First Project' });
        expect(secondProject).toMatchObject({ id: second.id, name: 'Second Project' });
    });

    test('lists all the inserted projects', async () => {
        await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

        const result = await callTool('graph-get-projects');

        expect(result.isError).toBeFalsy();
        expect(textOf(result)).toContain('First Project');
        expect(textOf(result)).toContain('Second Project');

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(2);
    });

    test('deletes one project by id', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

        const deleteResult = await callTool('graph-delete-project', { id: first.id });

        expect(deleteResult.isError).toBeFalsy();
        expect(textOf(deleteResult)).toContain('Project deleted successfully');

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({ name: 'Second Project' });

        const fetchResult = await fetchProject(first.id);
        expect(fetchResult.isError).toBe(true);
        expect(textOf(fetchResult)).toContain('Project not found');
    });
});

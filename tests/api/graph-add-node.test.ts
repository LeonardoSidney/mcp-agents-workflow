import type { NodeSummary } from '@domain/entities/node.ts';
import { ObjectId } from 'mongodb';
import { mcpTestHarness } from './mcpHarness.ts';

const { addNode, addProject, callTool, fetchNode, idOf, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-add-node', () => {
    test('adds a node linked to an existing graph', async () => {
        const graph = await addProject('Project With Nodes', 'Project used to host nodes');

        const node = await addNode(graph.id, 'GOAL', 'Ship the workflow', 'The workflow graph should be usable end to end');

        expect(node.graphId).toEqual(graph.id);

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
            graph_id: new ObjectId(graph.id),
            type: 'GOAL',
            title: 'Ship the workflow',
            status: 'pending'
        });
    });

    test('refuses to add a node for a graph that does not exist', async () => {
        const missingGraphId = '0'.repeat(24);

        const result = await callTool('graph-add-node', {
            graphId: missingGraphId,
            type: 'GOAL',
            title: 'Orphan node',
            description: 'Node pointing to a graph that does not exist',
            status: 'pending'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Graph not found');

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(0);
    });

    test('stores the workspace-relative paths and commit the node is anchored to', async () => {
        const graph = await addProject('Anchored Project', 'Project used to anchor nodes to code');

        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'DISCOVERY',
            title: 'Search folds plurals',
            description: 'Plural folding lives in the search service',
            paths: ['./src/application/services/graph/graphSearchNodesService.ts', 'src/mcp/'],
            commit: '7F750F2'
        });
        expect(result.isError).toBeFalsy();

        const fetched = await fetchNode(idOf(result));
        const node = JSON.parse(textOf(fetched)) as NodeSummary;
        expect(node.paths).toEqual(['src/application/services/graph/graphSearchNodesService.ts', 'src/mcp']);
        expect(node.commit).toEqual('7f750f2');
    });

    test('omits paths and commit from the node when none were given', async () => {
        const graph = await addProject('Unanchored Project', 'Project used to verify anchors stay optional');

        const node = await addNode(graph.id, 'TASK', 'Plain task', 'Task without code anchors');

        expect(node.paths).toBeUndefined();
        expect(node.commit).toBeUndefined();
    });

    test('refuses an absolute path', async () => {
        const graph = await addProject('Absolute Path Project', 'Project used to reject absolute paths');

        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'TASK',
            title: 'Absolute path node',
            description: 'Node anchored outside the workspace',
            paths: ['/etc/passwd']
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('relative to the workspace root');

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(0);
    });

    test('refuses a commit that is not a hex SHA', async () => {
        const graph = await addProject('Invalid Commit Project', 'Project used to reject invalid commits');

        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'TASK',
            title: 'Branch name as commit',
            description: 'Node anchored to a branch name instead of a SHA',
            commit: 'main'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid commit SHA');
    });

    test('lists a similar existing node of the same type after creating the node', async () => {
        const graph = await addProject('Similar Node Project', 'Project used to warn about similar nodes');
        const existing = await addNode(graph.id, 'SOLUTION', 'Unique project names on graph-add', 'Name uniqueness guard');

        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'SOLUTION',
            title: 'graph-add refuses duplicate project names',
            description: 'Another take on the same guard'
        });
        expect(result.isError).toBeFalsy();

        const text = textOf(result);
        expect(text).toMatch(/^Node created successfully: [0-9a-f]{24}\n/);
        expect(text).toContain(`Similar existing SOLUTION nodes, check for a duplicate: ${existing.id} "Unique project names on graph-add"`);

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(2);
    });

    test('adds no similar-node line when nothing similar exists', async () => {
        const graph = await addProject('Unique Node Project', 'Project used to verify the warning stays silent');
        await addNode(graph.id, 'SOLUTION', 'Plural folding in search', 'Search tokens fold plurals');

        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'SOLUTION',
            title: 'Usage counters for analytics',
            description: 'Unrelated solution'
        });

        expect(textOf(result)).toMatch(/^Node created successfully: [0-9a-f]{24}$/);
    });

    test('does not warn about a similar node of another type', async () => {
        const graph = await addProject('Cross Type Project', 'Project used to ignore task and solution pairs');
        await addNode(graph.id, 'TASK', 'Lean search output with bestEdge', 'The task');

        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'SOLUTION',
            title: 'Lean search output with responsible bestEdge',
            description: 'The solution of that task'
        });

        expect(textOf(result)).not.toContain('Similar existing');
    });

    test('warns about a same-type node anchored to overlapping paths', async () => {
        const graph = await addProject('Path Overlap Project', 'Project used to warn on overlapping paths');
        const anchored = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'CONSTRAINT',
            title: 'Tool schema pitfall',
            description: 'Anchored to the MCP folder',
            paths: ['src/mcp']
        });
        const anchoredId = idOf(anchored);

        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'CONSTRAINT',
            title: 'Zod strips unknown keys',
            description: 'Anchored to one MCP file',
            paths: ['src/mcp/nodeTools.ts']
        });

        expect(textOf(result)).toContain(`${anchoredId} "Tool schema pitfall"`);
    });
});

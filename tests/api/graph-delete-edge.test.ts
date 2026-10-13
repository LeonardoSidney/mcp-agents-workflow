import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addNode, addProject, callTool, edgesCollection, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-delete-edge', () => {
    test('refuses to delete an edge that is the only reference to its target node', async () => {
        const graph = await addProject('Edge Delete Guard Project', 'Project used to validate the only-reference guard on edge delete');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owned the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-delete-edge', { id: edge.id });
        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain(target.id);

        const storedEdges = await edgesCollection.find({ deleted_at: { $exists: false } }).toArray();
        expect(storedEdges).toHaveLength(1);

        const storedNodes = await nodesCollection.find({}).toArray();
        expect(storedNodes).toHaveLength(2);
    });

    test('deletes an edge when another edge still references its target node', async () => {
        const graph = await addProject('Edge Delete Shared Target Project', 'Project used to validate the shared target on edge delete');
        const firstSource = await addNode(graph.id, 'TASK', 'First source task', 'First task pointing at the goal');
        const secondSource = await addNode(graph.id, 'TASK', 'Second source task', 'Second task pointing at the goal');
        const goal = await addNode(graph.id, 'GOAL', 'Shared target goal', 'Goal referenced by two tasks');
        const edge = await addEdge(graph.id, firstSource.id, goal.id, 'PART_OF');
        await addEdge(graph.id, secondSource.id, goal.id, 'PART_OF');

        const result = await callTool('graph-delete-edge', { id: edge.id });
        expect(result.isError).toBeFalsy();

        const storedEdges = await edgesCollection.find({ deleted_at: { $exists: false } }).toArray();
        expect(storedEdges).toHaveLength(1);

        const storedNodes = await nodesCollection.find({}).toArray();
        expect(storedNodes).toHaveLength(3);
    });

    test('refuses to delete an edge that does not exist', async () => {
        const result = await callTool('graph-delete-edge', { id: '0'.repeat(24) });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Edge not found');
    });
});

import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addNode, addProject, callTool, edgesCollection, fetchNode, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-delete-edge', () => {
    test('deletes an edge by id', async () => {
        const graph = await addProject('Edge Delete Project', 'Project used to delete an edge');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owned the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-delete-edge', { id: edge.id });
        expect(result.isError).toBeFalsy();

        const storedEdges = await edgesCollection.find({}).toArray();
        expect(storedEdges).toHaveLength(0);

        const storedNodes = await nodesCollection.find({}).toArray();
        expect(storedNodes).toHaveLength(2);

        const fetchedSource = await fetchNode(source.id);
        expect(fetchedSource.isError).toBeFalsy();

        const sourceNode = JSON.parse(textOf(fetchedSource)) as NodeWithMemos;
        expect(sourceNode.edges).toEqual([]);
    });

    test('refuses to delete an edge that does not exist', async () => {
        const result = await callTool('graph-delete-edge', { id: '0'.repeat(24) });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Edge not found');
    });
});

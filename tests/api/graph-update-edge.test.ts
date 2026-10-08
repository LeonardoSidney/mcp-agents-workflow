import type { Edge } from '@domain/entities/edge.ts';
import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addNode, addProject, callTool, edgesCollection, fetchNode, textOf } = mcpTestHarness();

describe('MCP server - graph-update-edge', () => {
    test('updates only the edge description, keeping the type', async () => {
        const graph = await addProject('Description Update Project', 'Project used to update an edge description');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF', 'Original memory');

        const result = await callTool('graph-update-edge', { id: edge.id, description: 'Refined memory' });

        expect(result.isError).toBeFalsy();

        const parsed = JSON.parse(textOf(result).slice(textOf(result).indexOf('{'))) as Edge;
        expect(parsed).toMatchObject({ id: edge.id, type: 'PART_OF', description: 'Refined memory' });

        const stored = await edgesCollection.find({ id: edge.id }).toArray();
        expect(stored[0]).toMatchObject({ type: 'PART_OF', description: 'Refined memory' });
    });

    test('updates only the edge type, keeping the description', async () => {
        const graph = await addProject('Type Update Project', 'Project used to update an edge type');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF', 'Memory that must survive');

        const result = await callTool('graph-update-edge', { id: edge.id, type: 'RELATED_TO' });

        expect(result.isError).toBeFalsy();

        const parsed = JSON.parse(textOf(result).slice(textOf(result).indexOf('{'))) as Edge;
        expect(parsed).toMatchObject({ id: edge.id, type: 'RELATED_TO', description: 'Memory that must survive' });

        const stored = await edgesCollection.find({ id: edge.id }).toArray();
        expect(stored[0]).toMatchObject({ type: 'RELATED_TO', description: 'Memory that must survive' });
    });

    test('refuses to update an edge that does not exist', async () => {
        const result = await callTool('graph-update-edge', {
            id: '00000000-0000-4000-8000-000000000000',
            description: 'New memory'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Edge not found');
    });

    test('refuses to update an edge without any field to change', async () => {
        const graph = await addProject('Empty Edge Update Project', 'Project used for an empty edge update');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-update-edge', { id: edge.id });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('At least one field');
    });

    test('refuses to update an edge with an invalid type', async () => {
        const graph = await addProject('Invalid Edge Type Project', 'Project used for an invalid edge type');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-update-edge', { id: edge.id, type: 'NOT_A_TYPE' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid arguments');
    });

    test('updating an edge does not touch the node order or the edge collection', async () => {
        const graph = await addProject('Edge Touch Project', 'Project used to verify edge updates stay away from nodes');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-update-edge', { id: edge.id, description: 'New memory' });
        expect(result.isError).toBeFalsy();

        const stored = await edgesCollection.find({}).toArray();
        expect(stored).toHaveLength(1);

        const fetchedSource = await fetchNode(source.id);
        expect(fetchedSource.isError).toBeFalsy();

        const sourceNode = JSON.parse(textOf(fetchedSource)) as NodeWithMemos;
        expect(sourceNode.edges).toHaveLength(1);
        expect(sourceNode.edges[0]).toMatchObject({ id: edge.id, description: 'New memory' });
    });
});

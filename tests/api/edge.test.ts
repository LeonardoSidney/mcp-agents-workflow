import type { Edge } from '@domain/entities/edge.ts';
import type { NodeWithEdges } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addNode, addProject, callTool, edgesCollection, fetchNode, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - edge lifecycle', () => {
    test('adds an edge that is stored in the edges collection with the returned id', async () => {
        const graph = await addProject('Edge Lifecycle Project', 'Project used to add edges', 'waiting_goal');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');

        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF', 'Part of the main goal');

        expect(edge.graphId).toEqual(graph.id);
        expect(edge.sourceId).toEqual(source.id);
        expect(edge.targetId).toEqual(target.id);

        const stored = await edgesCollection.find({}).toArray();
        expect(stored).toHaveLength(1);
        expect(stored[0]).toMatchObject({
            id: edge.id,
            graph_id: graph.id,
            source_id: source.id,
            target_id: target.id,
            type: 'PART_OF',
            description: 'Part of the main goal'
        });

        const nodeDocuments = await nodesCollection.find({}).toArray();
        expect(nodeDocuments.every(document => !('edges' in document))).toBe(true);
    });

    test('adds parallel edges with different memories', async () => {
        const graph = await addProject('Parallel Edge Project', 'Project used to test parallel edges', 'waiting_goal');
        const rule = await addNode(graph.id, 'USER_DECISION', 'First rule', 'First recorded rule');
        const task = await addNode(graph.id, 'TASK', 'Constrained task', 'Task with two constraints');

        const first = await addEdge(graph.id, task.id, rule.id, 'CONSTRAINED_BY', 'First memory');
        const second = await addEdge(graph.id, task.id, rule.id, 'CONSTRAINED_BY', 'Second memory');

        expect(first.id).not.toEqual(second.id);
        expect(first.description).toEqual('First memory');
        expect(second.description).toEqual('Second memory');

        const stored = await edgesCollection.find({ source_id: task.id }).toArray();
        expect(stored).toHaveLength(2);
        expect(stored.map(edge => edge.description).sort()).toEqual(['First memory', 'Second memory']);
    });

    test('refuses to add an edge for a graph that does not exist', async () => {
        const missingGraphId = '00000000-0000-4000-8000-000000000000';
        const graph = await addProject('Edge Graph', 'Project used to test a missing graph', 'waiting_goal');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task used in the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal used in the edge');

        const result = await callTool('graph-add-edge', {
            graphId: missingGraphId,
            sourceId: source.id,
            targetId: target.id,
            type: 'PART_OF'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Graph not found');

        const stored = await edgesCollection.find({}).toArray();
        expect(stored).toHaveLength(0);
    });

    test('refuses to add an edge from a source node that does not exist', async () => {
        const graph = await addProject('Missing Source Project', 'Project used to test a missing source', 'waiting_goal');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal used in the edge');

        const result = await callTool('graph-add-edge', {
            graphId: graph.id,
            sourceId: '00000000-0000-4000-8000-000000000000',
            targetId: target.id,
            type: 'PART_OF'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Source node not found');
    });

    test('refuses to add an edge to a target node that does not exist', async () => {
        const graph = await addProject('Missing Target Project', 'Project used to test a missing target', 'waiting_goal');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task used in the edge');

        const result = await callTool('graph-add-edge', {
            graphId: graph.id,
            sourceId: source.id,
            targetId: '00000000-0000-4000-8000-000000000000',
            type: 'PART_OF'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Target node not found');
    });

    test('refuses to add an edge from a source node of another graph', async () => {
        const firstGraph = await addProject('First Edge Graph', 'First graph', 'waiting_goal');
        const secondGraph = await addProject('Second Edge Graph', 'Second graph', 'waiting_goal');
        const foreignSource = await addNode(firstGraph.id, 'TASK', 'Foreign source', 'Task from another graph');
        const target = await addNode(secondGraph.id, 'GOAL', 'Local goal', 'Goal of the second graph');

        const result = await callTool('graph-add-edge', {
            graphId: secondGraph.id,
            sourceId: foreignSource.id,
            targetId: target.id,
            type: 'RELATED_TO'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('does not belong to graph');

        const stored = await edgesCollection.find({}).toArray();
        expect(stored).toHaveLength(0);
    });

    test('updates only the edge description, keeping the type', async () => {
        const graph = await addProject('Description Update Project', 'Project used to update an edge description', 'waiting_goal');
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
        const graph = await addProject('Type Update Project', 'Project used to update an edge type', 'waiting_goal');
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
        const graph = await addProject('Empty Edge Update Project', 'Project used for an empty edge update', 'waiting_goal');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-update-edge', { id: edge.id });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('At least one field');
    });

    test('refuses to update an edge with an invalid type', async () => {
        const graph = await addProject('Invalid Edge Type Project', 'Project used for an invalid edge type', 'waiting_goal');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-update-edge', { id: edge.id, type: 'NOT_A_TYPE' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid arguments');
    });

    test('updating an edge does not touch the node order or the edge collection', async () => {
        const graph = await addProject('Edge Touch Project', 'Project used to verify edge updates stay away from nodes', 'waiting_goal');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the edge');
        const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the edge');
        const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');

        const result = await callTool('graph-update-edge', { id: edge.id, description: 'New memory' });
        expect(result.isError).toBeFalsy();

        const stored = await edgesCollection.find({}).toArray();
        expect(stored).toHaveLength(1);

        const fetchedSource = await fetchNode(source.id);
        expect(fetchedSource.isError).toBeFalsy();

        const sourceNode = JSON.parse(textOf(fetchedSource)) as NodeWithEdges;
        expect(sourceNode.edges).toHaveLength(1);
        expect(sourceNode.edges[0]).toMatchObject({ id: edge.id, description: 'New memory' });
    });

    test('deletes an edge by id', async () => {
        const graph = await addProject('Edge Delete Project', 'Project used to delete an edge', 'waiting_goal');
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

        const sourceNode = JSON.parse(textOf(fetchedSource)) as NodeWithEdges;
        expect(sourceNode.edges).toEqual([]);
    });

    test('refuses to delete an edge that does not exist', async () => {
        const result = await callTool('graph-delete-edge', { id: '00000000-0000-4000-8000-000000000000' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Edge not found');
    });
});

import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addNode, addProject, callTool, edgesCollection, fetchNode, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-add-edge', () => {
    test('adds an edge that is stored in the edges collection with the returned id', async () => {
        const graph = await addProject('Edge Lifecycle Project', 'Project used to add edges');
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

    test('adds an edge to a target node of the same graph', async () => {
        const graph = await addProject('Linked Project', 'Project hosting linked nodes');
        const goal = await addNode(graph.id, 'GOAL', 'Main goal', 'Main goal of the project');
        const task = await addNode(graph.id, 'TASK', 'Build the server', 'Build the MCP server');

        const edge = await addEdge(graph.id, task.id, goal.id, 'PART_OF');

        const saved = await nodesCollection.find({ id: task.id }).toArray();
        const storedTask = saved[0];
        if (!storedTask) {
            throw new Error(`Expected the task node to be stored: ${task.id}`);
        }
        expect(storedTask).not.toHaveProperty('links');
        expect(storedTask).not.toHaveProperty('edges');

        const edgeDocuments = await edgesCollection.find({ source_id: task.id }).toArray();
        expect(edgeDocuments).toHaveLength(1);
        const edgeDocument = edgeDocuments[0];
        if (!edgeDocument?.id) {
            throw new Error('Expected the stored edge to carry an id');
        }

        expect(edgeDocument).toMatchObject({ id: edge.id, type: 'PART_OF', target_id: goal.id, graph_id: graph.id });

        const fetched = await fetchNode(task.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.edges).toHaveLength(1);
        expect(stored.edges[0]).toMatchObject({ id: edge.id, type: 'PART_OF', targetId: goal.id });
    });

    test('adds parallel edges with different memories', async () => {
        const graph = await addProject('Parallel Edge Project', 'Project used to test parallel edges');
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
        const graph = await addProject('Edge Graph', 'Project used to test a missing graph');
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
        const graph = await addProject('Missing Source Project', 'Project used to test a missing source');
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
        const graph = await addProject('Missing Target Project', 'Project used to test a missing target');
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
        const firstGraph = await addProject('First Edge Graph', 'First graph');
        const secondGraph = await addProject('Second Edge Graph', 'Second graph');
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

    test('refuses an edge to a target node of another graph', async () => {
        const firstGraph = await addProject('First Graph', 'First graph');
        const secondGraph = await addProject('Second Graph', 'Second graph');
        const foreignNode = await addNode(firstGraph.id, 'GOAL', 'Foreign goal', 'Goal from another graph');
        const task = await addNode(secondGraph.id, 'TASK', 'Cross graph task', 'Task linking to a node of another graph');

        const result = await callTool('graph-add-edge', {
            graphId: secondGraph.id,
            sourceId: task.id,
            targetId: foreignNode.id,
            type: 'RELATED_TO'
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('does not belong to graph');

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(2);

        const storedEdges = await edgesCollection.find({}).toArray();
        expect(storedEdges).toHaveLength(0);
    });
});

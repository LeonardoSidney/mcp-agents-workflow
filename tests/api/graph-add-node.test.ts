import { mcpTestHarness } from './mcpHarness.ts';

const { addNode, addProject, callTool, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-add-node', () => {
    test('adds a node linked to an existing graph', async () => {
        const graph = await addProject('Project With Nodes', 'Project used to host nodes', 'waiting_goal');

        const node = await addNode(graph.id, 'GOAL', 'Ship the workflow', 'The workflow graph should be usable end to end');

        expect(node.graphId).toEqual(graph.id);

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
            graph_id: graph.id,
            type: 'GOAL',
            title: 'Ship the workflow',
            status: 'pending'
        });
    });

    test('refuses to add a node for a graph that does not exist', async () => {
        const missingGraphId = '00000000-0000-4000-8000-000000000000';

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
});

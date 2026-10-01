import type { Node } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addNode, addProject, callTool, fetchNode, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - node lifecycle', () => {
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

    test('updates a node status and description, leaving other fields untouched', async () => {
        const graph = await addProject('Update Project', 'Project used to update a node', 'waiting_goal');
        const node = await addNode(graph.id, 'TASK', 'Build the server', 'Build the MCP server');

        const result = await callTool('graph-update-node', {
            id: node.id,
            status: 'completed',
            description: 'MCP server running and tests green'
        });

        expect(result.isError).toBeFalsy();
        const jsonStart = textOf(result).indexOf('{');
        const updated = JSON.parse(textOf(result).slice(jsonStart)) as Node;
        expect(updated).toMatchObject({
            id: node.id,
            graphId: graph.id,
            type: 'TASK',
            title: 'Build the server',
            status: 'completed',
            description: 'MCP server running and tests green'
        });

        const saved = await nodesCollection.find({ id: node.id }).toArray();
        expect(saved).toHaveLength(1);
        const stored = saved[0];
        if (!stored) {
            throw new Error(`Expected the node to be stored: ${node.id}`);
        }

        expect(stored).toMatchObject({ status: 'completed', title: 'Build the server' });
    });

    test('replaces the whole links list on update, an empty list clears links', async () => {
        const graph = await addProject('Re-link Project', 'Project used to replace links', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Main goal', 'Main goal of the project');
        const related = await addNode(graph.id, 'FACT', 'Known fact', 'Established fact');
        const task = await addNode(graph.id, 'TASK', 'Dependent task', 'Task linked to the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);

        const relinked = await callTool('graph-update-node', {
            id: task.id,
            links: [{ type: 'DERIVED_FROM', targetId: related.id }]
        });
        expect(relinked.isError).toBeFalsy();

        const cleared = await callTool('graph-update-node', { id: task.id, links: [] });
        expect(cleared.isError).toBeFalsy();

        const saved = await nodesCollection.find({ id: task.id }).toArray();
        const stored = saved[0];
        if (!stored) {
            throw new Error(`Expected the task node to be stored: ${task.id}`);
        }

        expect(stored.links).toEqual([]);
    });

    test('refuses to update a node that does not exist', async () => {
        const missingNodeId = '00000000-0000-4000-8000-000000000000';

        const result = await callTool('graph-update-node', { id: missingNodeId, status: 'completed' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Node not found');
    });

    test('refuses to update a node without any field to change', async () => {
        const graph = await addProject('Empty Update Project', 'Project used for an empty update', 'waiting_goal');
        const node = await addNode(graph.id, 'GOAL', 'Goal', 'A goal');

        const result = await callTool('graph-update-node', { id: node.id });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('At least one field must be provided');
    });

    test('refuses update links to a target node of another graph', async () => {
        const firstGraph = await addProject('First Update Graph', 'First graph', 'waiting_goal');
        const secondGraph = await addProject('Second Update Graph', 'Second graph', 'waiting_goal');
        const foreignNode = await addNode(firstGraph.id, 'GOAL', 'Foreign goal', 'Goal from another graph');
        const task = await addNode(secondGraph.id, 'TASK', 'Local task', 'Task of the second graph');

        const result = await callTool('graph-update-node', {
            id: task.id,
            links: [{ type: 'RELATED_TO', targetId: foreignNode.id }]
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('does not belong to graph');
    });

    test('refuses to add a node for a graph that does not exist', async () => {
        const missingGraphId = '00000000-0000-4000-8000-000000000000';

        const result = await callTool('graph-add-node', {
            graphId: missingGraphId,
            type: 'GOAL',
            title: 'Orphan node',
            description: 'Node pointing to a graph that does not exist',
            status: 'pending',
            links: []
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Graph not found');

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(0);
    });

    test('links a node to a target node of the same graph', async () => {
        const graph = await addProject('Linked Project', 'Project hosting linked nodes', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Main goal', 'Main goal of the project');
        const task = await addNode(graph.id, 'TASK', 'Build the server', 'Build the MCP server', [
            { type: 'PART_OF', targetId: goal.id }
        ]);

        const saved = await nodesCollection.find({ id: task.id }).toArray();
        const storedTask = saved[0];
        if (!storedTask) {
            throw new Error(`Expected the task node to be stored: ${task.id}`);
        }

        expect(storedTask.links).toEqual([{ type: 'PART_OF', targetId: goal.id }]);
    });

    test('refuses links to a target node of another graph', async () => {
        const firstGraph = await addProject('First Graph', 'First graph', 'waiting_goal');
        const secondGraph = await addProject('Second Graph', 'Second graph', 'waiting_goal');
        const foreignNode = await addNode(firstGraph.id, 'GOAL', 'Foreign goal', 'Goal from another graph');

        const result = await callTool('graph-add-node', {
            graphId: secondGraph.id,
            type: 'TASK',
            title: 'Cross graph task',
            description: 'Task linking to a node of another graph',
            status: 'pending',
            links: [{ type: 'RELATED_TO', targetId: foreignNode.id }]
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('does not belong to graph');

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(1);
    });

    test('lists the nodes of one graph sorted by the most recent first', async () => {
        const graph = await addProject('Panorama Project', 'Project used to list nodes', 'waiting_goal');
        const otherGraph = await addProject('Other Graph', 'Graph that must not leak nodes', 'waiting_goal');

        await addNode(otherGraph.id, 'GOAL', 'Other goal', 'Goal of the other graph');
        await addNode(graph.id, 'GOAL', 'First goal', 'First goal of the panorama');
        const latest = await addNode(graph.id, 'TASK', 'Latest task', 'Most recently added node of the panorama');

        const result = await callTool('graph-get-nodes', { graphId: graph.id });

        expect(result.isError).toBeFalsy();
        expect(textOf(result)).not.toContain('Other goal');
        expect(textOf(result)).toContain('First goal');

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; }[];
        expect(nodes).toHaveLength(2);
        const mostRecent = nodes[0];
        if (!mostRecent) {
            throw new Error('Expected at least one node in the list');
        }

        expect(mostRecent.id).toEqual(latest.id);
    });

    test('fetches a node by id', async () => {
        const graph = await addProject('Fetch Project', 'Project used to fetch a node', 'waiting_goal');
        const node = await addNode(graph.id, 'REQUIREMENT', 'Required behavior', 'Behavior the project must satisfy');

        const result = await fetchNode(node.id);

        expect(result.isError).toBeFalsy();

        const fetched = JSON.parse(textOf(result)) as Node;
        expect(fetched).toMatchObject({
            id: node.id,
            graphId: graph.id,
            type: 'REQUIREMENT',
            title: 'Required behavior'
        });
    });

    test('removes links pointing to a deleted node', async () => {
        const graph = await addProject('Delete Project', 'Project used to delete a node', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Removable goal', 'Goal that will be deleted');
        const task = await addNode(graph.id, 'TASK', 'Dependent task', 'Task linked to the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);

        const deleteResult = await callTool('graph-delete-node', { id: goal.id });

        expect(deleteResult.isError).toBeFalsy();
        expect(textOf(deleteResult)).toContain('Node deleted successfully');

        const survivor = await nodesCollection.find({ id: task.id }).toArray();
        const storedSurvivor = survivor[0];
        if (!storedSurvivor) {
            throw new Error(`Expected the dependent task to survive the deletion: ${task.id}`);
        }

        expect(storedSurvivor.links).toEqual([]);

        const survivorFetch = await fetchNode(task.id);
        expect(survivorFetch.isError).toBeFalsy();

        const goneFetch = await fetchNode(goal.id);
        expect(goneFetch.isError).toBe(true);
        expect(textOf(goneFetch)).toContain('Node not found');
    });

    test('refuses to delete a node that does not exist', async () => {
        const missingNodeId = '00000000-0000-4000-8000-000000000000';

        const result = await callTool('graph-delete-node', { id: missingNodeId });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Node not found');
    });

    test('survivor of a cascade link removal surfaces as the most recent node', async () => {
        const graph = await addProject('Cascade Project', 'Project used to test cascade ordering', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Cascaded goal', 'Goal that will be deleted');
        const task = await addNode(graph.id, 'TASK', 'Linked task', 'Task linked to the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);
        const fresh = await addNode(graph.id, 'FACT', 'Fresh fact', 'Most recent node before the cascade');

        const deleteResult = await callTool('graph-delete-node', { id: goal.id });
        expect(deleteResult.isError).toBeFalsy();

        const result = await callTool('graph-get-nodes', { graphId: graph.id });
        expect(result.isError).toBeFalsy();

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; }[];
        const mostRecent = nodes[0];
        if (!mostRecent) {
            throw new Error('Expected at least one node in the list');
        }

        expect(mostRecent.id).toEqual(task.id);
        expect(nodes.map(node => node.id)).toEqual([task.id, fresh.id]);
    });
});

import type { NodeWithMemos } from '@domain/entities/node.ts';
import { ObjectId } from 'mongodb';
import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addMemo, addNode, addProject, callTool, fetchNode, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-update-node', () => {
    test('updates a node status and description, leaving other fields untouched', async () => {
        const graph = await addProject('Update Project', 'Project used to update a node');
        const node = await addNode(graph.id, 'TASK', 'Build the server', 'Build the MCP server');

        const result = await callTool('graph-update-node', {
            id: node.id,
            status: 'completed',
            description: 'MCP server running and tests green'
        });

        expect(result.isError).toBeFalsy();
        const jsonStart = textOf(result).indexOf('{');
        const updated = JSON.parse(textOf(result).slice(jsonStart)) as NodeWithMemos;
        expect(updated).toMatchObject({
            id: node.id,
            graphId: graph.id,
            type: 'TASK',
            title: 'Build the server',
            status: 'completed',
            description: 'MCP server running and tests green'
        });

        const saved = await nodesCollection.find({ _id: new ObjectId(node.id) }).toArray();
        expect(saved).toHaveLength(1);
        const stored = saved[0];
        if (!stored) {
            throw new Error(`Expected the node to be stored: ${node.id}`);
        }

        expect(stored).toMatchObject({ status: 'completed', title: 'Build the server' });
    });

    test('updating a node never touches its edges', async () => {
        const graph = await addProject('Edge-Touch Project', 'Project used to verify node updates stay away from edges');
        const goal = await addNode(graph.id, 'GOAL', 'Main goal', 'Main goal of the project');
        const task = await addNode(graph.id, 'TASK', 'Dependent task', 'Task linked to the goal');
        const edge = await addEdge(graph.id, task.id, goal.id, 'PART_OF');

        const updated = await callTool('graph-update-node', { id: task.id, status: 'in_progress' });
        expect(updated.isError).toBeFalsy();

        const fetched = await fetchNode(task.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.edges).toHaveLength(1);
        expect(stored.edges[0]).toMatchObject({ id: edge.id, type: 'PART_OF', targetId: goal.id });
    });

    test('updating a node never touches its memos', async () => {
        const graph = await addProject('Memo Untouched Project', 'Project used to verify node updates stay away from memos');
        const node = await addNode(graph.id, 'TASK', 'Memoed and updated task', 'Task updated after a memo was recorded');
        await addMemo(node.id, 'agent', 'The first recorded thought on this task');

        const updated = await callTool('graph-update-node', { id: node.id, status: 'in_progress', title: 'Renamed task' });
        expect(updated.isError).toBeFalsy();

        const fetched = await fetchNode(node.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.title).toEqual('Renamed task');
        expect(stored.memos).toHaveLength(1);
        expect(stored.memos[0]).toMatchObject({
            author: 'agent',
            text: 'The first recorded thought on this task'
        });
    });

    test('refuses to update a node that does not exist', async () => {
        const missingNodeId = '0'.repeat(24);

        const result = await callTool('graph-update-node', { id: missingNodeId, status: 'completed' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Node not found');
    });

    test('refuses to update a node without any field to change', async () => {
        const graph = await addProject('Empty Update Project', 'Project used for an empty update');
        const node = await addNode(graph.id, 'GOAL', 'Goal', 'A goal');

        const result = await callTool('graph-update-node', { id: node.id });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('At least one field must be provided');
    });
});

import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addMemo, addNode, addProject, callTool, edgesCollection, fetchNode, memosCollection, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-delete-node', () => {
    test('refuses to delete a node that an edge still points to', async () => {
        const graph = await addProject('Delete Project', 'Project used to delete a node', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Removable goal', 'Goal that will be deleted');
        const task = await addNode(graph.id, 'TASK', 'Dependent task', 'Task linked to the goal');
        const edge = await addEdge(graph.id, task.id, goal.id, 'PART_OF');

        const deleteResult = await callTool('graph-delete-node', { id: goal.id });

        expect(deleteResult.isError).toBe(true);
        expect(textOf(deleteResult)).toContain('is attached by');
        expect(textOf(deleteResult)).toContain(edge.id);

        const survivorFetch = await fetchNode(goal.id);
        expect(survivorFetch.isError).toBeFalsy();
    });

    test('refuses to delete a node that does not exist', async () => {
        const missingNodeId = '00000000-0000-4000-8000-000000000000';

        const result = await callTool('graph-delete-node', { id: missingNodeId });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Node not found');
    });

    test('refuses to delete a node with outgoing edges until they are removed', async () => {
        const graph = await addProject('Orphan Project', 'Project used to test outgoing edge cleanup', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Orphan goal', 'Goal pointed at by the removed task');
        const task = await addNode(graph.id, 'TASK', 'Orphan source task', 'Task whose edges must be removed first');
        const edge = await addEdge(graph.id, task.id, goal.id, 'PART_OF', 'Records how the goal was resolved');

        const firstDelete = await callTool('graph-delete-node', { id: task.id });
        expect(firstDelete.isError).toBe(true);
        expect(textOf(firstDelete)).toContain('is attached by');

        const removeEdge = await callTool('graph-delete-edge', { id: edge.id });
        expect(removeEdge.isError).toBeFalsy();

        const secondDelete = await callTool('graph-delete-node', { id: task.id });
        expect(secondDelete.isError).toBeFalsy();

        const remainingEdges = await edgesCollection.find({}).toArray();
        expect(remainingEdges).toHaveLength(0);

        const remainingNodes = await nodesCollection.find({}).toArray();
        expect(remainingNodes).toHaveLength(1);
        expect(remainingNodes[0]).toMatchObject({ id: goal.id });
    });

    test('allows deleting a node whose edges were deleted earlier', async () => {
        const graph = await addProject('Ghost Project', 'Project used to test detached node deletion', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Ghost goal', 'Goal referenced by a soon-removed task');
        const task = await addNode(graph.id, 'TASK', 'Ghost task', 'Task pointing at the goal');
        const edge = await addEdge(graph.id, task.id, goal.id, 'PART_OF');

        const removeEdge = await callTool('graph-delete-edge', { id: edge.id });
        expect(removeEdge.isError).toBeFalsy();

        const firstDelete = await callTool('graph-delete-node', { id: task.id });
        expect(firstDelete.isError).toBeFalsy();

        const secondDelete = await callTool('graph-delete-node', { id: goal.id });
        expect(secondDelete.isError).toBeFalsy();

        const remainingNodes = await nodesCollection.find({}).toArray();
        expect(remainingNodes).toHaveLength(0);

        const remainingEdges = await edgesCollection.find({}).toArray();
        expect(remainingEdges).toHaveLength(0);
    });

    test('deleting a node removes its memos from the memos collection', async () => {
        const graph = await addProject('Memo Delete Project', 'Project used to delete a node with memos', 'waiting_goal');
        const node = await addNode(graph.id, 'TASK', 'Doomed task', 'Task that will be deleted with its memos');
        await addMemo(node.id, 'user', 'A discussion that dies with the node');

        const deleteResult = await callTool('graph-delete-node', { id: node.id });
        expect(deleteResult.isError).toBeFalsy();

        const remainingMemos = await memosCollection.find({}).toArray();
        expect(remainingMemos).toHaveLength(0);

        const remainingNodes = await nodesCollection.find({}).toArray();
        expect(remainingNodes).toHaveLength(0);
    });
});

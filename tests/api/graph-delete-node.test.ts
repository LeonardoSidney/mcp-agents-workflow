import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addMemo, addNode, addProject, callTool, edgesCollection, fetchNode, memosCollection, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-delete-node', () => {
    test('refuses to delete a node that an edge still points to', async () => {
        const graph = await addProject('Delete Project', 'Project used to delete a node');
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
        const missingNodeId = '0'.repeat(24);

        const result = await callTool('graph-delete-node', { id: missingNodeId });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Node not found');
    });

    test('refuses node and edge deletion while the edge is the only reference to its target node', async () => {
        const graph = await addProject('Orphan Project', 'Project used to test the only-reference guard on edge delete');
        const goal = await addNode(graph.id, 'GOAL', 'Orphan goal', 'Goal pointed at by the task');
        const task = await addNode(graph.id, 'TASK', 'Orphan source task', 'Task linked to the goal');
        const edge = await addEdge(graph.id, task.id, goal.id, 'PART_OF', 'Records how the goal was resolved');

        const nodeDelete = await callTool('graph-delete-node', { id: task.id });
        expect(nodeDelete.isError).toBe(true);
        expect(textOf(nodeDelete)).toContain('is attached by');
        expect(textOf(nodeDelete)).toContain(edge.id);

        const edgeDelete = await callTool('graph-delete-edge', { id: edge.id });
        expect(edgeDelete.isError).toBe(true);
        expect(textOf(edgeDelete)).toContain(goal.id);

        const remainingEdges = await edgesCollection.find({ deleted_at: { $exists: false } }).toArray();
        expect(remainingEdges).toHaveLength(1);

        const remainingNodes = await nodesCollection.find({ deleted_at: { $exists: false } }).toArray();
        expect(remainingNodes).toHaveLength(2);
    });

    test('deleting a node deletes its memos', async () => {
        const graph = await addProject('Memo Delete Project', 'Project used to delete a node with memos');
        const node = await addNode(graph.id, 'TASK', 'Doomed task', 'Task that will be deleted with its memos');
        await addMemo(node.id, 'user', 'note', 'A discussion that dies with the node');

        const deleteResult = await callTool('graph-delete-node', { id: node.id });
        expect(deleteResult.isError).toBeFalsy();

        const remainingMemos = await memosCollection.find({ deleted_at: { $exists: false } }).toArray();
        expect(remainingMemos).toHaveLength(0);

        const remainingNodes = await nodesCollection.find({ deleted_at: { $exists: false } }).toArray();
        expect(remainingNodes).toHaveLength(0);
    });
});

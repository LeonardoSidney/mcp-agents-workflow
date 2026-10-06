import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addMemo, addNode, addProject, callTool, fetchNode, memosCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-append-memo', () => {
    test('appends a memo and stores it in the memos collection linked by node_id', async () => {
        const graph = await addProject('Memo Project', 'Project used to append memos', 'waiting_goal');
        const node = await addNode(graph.id, 'TASK', 'Payment task', 'Compute the payment amount');

        const memo = await addMemo(node.id, 'agent', 'Stuck: the discount rule is not applied when the total is negative');

        expect(memo).toMatchObject({
            author: 'agent',
            text: 'Stuck: the discount rule is not applied when the total is negative'
        });

        const saved = await memosCollection.find({}).toArray();
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
            node_id: node.id,
            author: 'agent',
            text: 'Stuck: the discount rule is not applied when the total is negative'
        });
    });

    test('appends memos to a completed node and they survive the completion', async () => {
        const graph = await addProject('Memo Completed Project', 'Project used to memo a completed node', 'waiting_goal');
        const node = await addNode(graph.id, 'TASK', 'Done task', 'Task that will be completed before the memo');

        const updated = await callTool('graph-update-node', { id: node.id, status: 'completed' });
        expect(updated.isError).toBeFalsy();

        await addMemo(node.id, 'system', 'The retry rule that unblocked this task: limit the queue depth to 10');

        const fetched = await fetchNode(node.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.status).toEqual('completed');
        expect(stored.memos).toHaveLength(1);
        expect(stored.memos[0]).toMatchObject({
            author: 'system',
            text: 'The retry rule that unblocked this task: limit the queue depth to 10'
        });
    });

    test('refuses to append a memo to a node that does not exist', async () => {
        const missingNodeId = '00000000-0000-4000-8000-000000000000';

        const result = await callTool('graph-append-memo', { id: missingNodeId, author: 'agent', text: 'An orphan memo' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Node not found');

        const saved = await memosCollection.find({}).toArray();
        expect(saved).toHaveLength(0);
    });

    test('refuses to append a memo with an empty text', async () => {
        const graph = await addProject('Memo Empty Text Project', 'Project used to reject an empty memo', 'waiting_goal');
        const node = await addNode(graph.id, 'TASK', 'Memoed task', 'Task used to reject an empty memo');

        const result = await callTool('graph-append-memo', { id: node.id, author: 'agent', text: '' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid arguments');

        const saved = await memosCollection.find({}).toArray();
        expect(saved).toHaveLength(0);
    });
});

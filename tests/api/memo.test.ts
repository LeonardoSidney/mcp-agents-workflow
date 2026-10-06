import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addMemo, addNode, addProject, callTool, fetchNode, memosCollection, nodesCollection, textOf } = mcpTestHarness();

describe('MCP server - memo lifecycle', () => {
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

  test('exposes the memos of a node in chronological order through graph-get-node', async () => {
    const graph = await addProject('Memo Read Project', 'Project used to read node memos', 'waiting_goal');
    const node = await addNode(graph.id, 'TASK', 'Refund task', 'Process the refund flow');
    await addMemo(node.id, 'agent', 'The refund queue is saturated, retrying later');
    await addMemo(node.id, 'user', 'The refund limit per customer is 500 per month');

    const fetched = await fetchNode(node.id);
    expect(fetched.isError).toBeFalsy();

    const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
    expect(stored.memos).toHaveLength(2);
    expect(stored.memos[0]).toMatchObject({
      author: 'agent',
      text: 'The refund queue is saturated, retrying later'
    });
    expect(stored.memos[1]).toMatchObject({
      author: 'user',
      text: 'The refund limit per customer is 500 per month'
    });
  });

  test('exposes empty memos for a node without any recorded discussion', async () => {
    const graph = await addProject('Memo Empty Project', 'Project used to read a node without memos', 'waiting_goal');
    const node = await addNode(graph.id, 'FACT', 'Standing fact', 'A fact with no discussion');

    const fetched = await fetchNode(node.id);
    expect(fetched.isError).toBeFalsy();

    const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
    expect(stored.memos).toEqual([]);
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

  test('updating a node never touches its memos', async () => {
    const graph = await addProject('Memo Untouched Project', 'Project used to verify node updates stay away from memos', 'waiting_goal');
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

  test('keeps memo timestamps out of tool responses', async () => {
    const graph = await addProject('Memo Stamps Project', 'Project used to check exposed memo fields', 'waiting_goal');
    const node = await addNode(graph.id, 'TASK', 'Stamped task', 'Task used to check exposed fields');
    await addMemo(node.id, 'agent', 'A memo with a stamp that must not be exposed');

    const fetched = await fetchNode(node.id);
    expect(fetched.isError).toBeFalsy();
    expect(textOf(fetched)).not.toContain('createdAt');
    expect(textOf(fetched)).not.toContain('created_at');
    expect(textOf(fetched)).not.toContain('updatedAt');
    expect(textOf(fetched)).not.toContain('updated_at');
  });
});

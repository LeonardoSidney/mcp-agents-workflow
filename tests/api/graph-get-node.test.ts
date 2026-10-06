import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addMemo, addNode, addProject, callTool, fetchNode, textOf } = mcpTestHarness();

describe('MCP server - graph-get-node', () => {
    test('fetches a node by id', async () => {
        const graph = await addProject('Fetch Project', 'Project used to fetch a node', 'waiting_goal');
        const node = await addNode(graph.id, 'REQUIREMENT', 'Required behavior', 'Behavior the project must satisfy');

        const result = await fetchNode(node.id);

        expect(result.isError).toBeFalsy();

        const fetched = JSON.parse(textOf(result)) as NodeWithMemos;
        expect(fetched).toMatchObject({
            id: node.id,
            graphId: graph.id,
            type: 'REQUIREMENT',
            title: 'Required behavior'
        });
    });

    test('keeps node timestamps out of tool responses', async () => {
        const graph = await addProject('Stamps Project', 'Project used to check exposed fields', 'waiting_goal');
        const node = await addNode(graph.id, 'TASK', 'Stamped task', 'Task used to check exposed fields');

        const fetched = await fetchNode(node.id);
        expect(fetched.isError).toBeFalsy();
        expect(textOf(fetched)).not.toContain('createdAt');
        expect(textOf(fetched)).not.toContain('updatedAt');
        expect(textOf(fetched)).not.toContain('created_at');
        expect(textOf(fetched)).not.toContain('updated_at');

        const listed = await callTool('graph-get-nodes', { graphId: graph.id });
        expect(listed.isError).toBeFalsy();
        expect(textOf(listed)).not.toContain('createdAt');
        expect(textOf(listed)).not.toContain('created_at');
    });

    test('keeps the description recorded on an edge when fetching the source node', async () => {
        const graph = await addProject('Edge Memory Project', 'Project used to record edge memory', 'waiting_goal');
        const rule = await addNode(graph.id, 'USER_DECISION', 'Reimbursement rule', 'Only expenses under the daily limit are reimbursed');
        const task = await addNode(graph.id, 'TASK', 'Prepare expense report', 'Prepare the final expense report');
        await addEdge(graph.id, task.id, rule.id, 'CONSTRAINED_BY', 'The daily limit rule applies because the report covers travel days');

        const fetched = await fetchNode(task.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.edges).toHaveLength(1);
        expect(stored.edges[0]).toMatchObject({
            type: 'CONSTRAINED_BY',
            targetId: rule.id,
            description: 'The daily limit rule applies because the report covers travel days'
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

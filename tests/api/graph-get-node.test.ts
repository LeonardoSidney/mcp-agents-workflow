import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addMemo, addNode, addProject, callTool, fetchNode, textOf } = mcpTestHarness();

describe('MCP server - graph-get-node', () => {
    test('fetches a node by id', async () => {
        const graph = await addProject('Fetch Project', 'Project used to fetch a node');
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
        const graph = await addProject('Stamps Project', 'Project used to check exposed fields');
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
        const graph = await addProject('Edge Memory Project', 'Project used to record edge memory');
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
            targetTitle: 'Reimbursement rule',
            description: 'The daily limit rule applies because the report covers travel days'
        });
    });

    test('makes outgoing edges self-describing with each target node title', async () => {
        const graph = await addProject('Edge Title Project', 'Project used to check edge target titles');
        const rule = await addNode(graph.id, 'CONSTRAINT', 'Standing constraint', 'A rule that applies to the task');
        const solution = await addNode(graph.id, 'SOLUTION', 'Proven solution', 'An approach that resolved the task');
        const task = await addNode(graph.id, 'TASK', 'Working task', 'Task pointing at multiple targets');
        await addEdge(graph.id, task.id, rule.id, 'CONSTRAINED_BY', 'The standing rule applies to the task');
        await addEdge(graph.id, task.id, solution.id, 'SOLVED_BY', 'The task was resolved by the proven approach');

        const fetched = await fetchNode(task.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.edges).toHaveLength(2);
        expect(stored.edges.filter(edge => edge.targetId === rule.id)[0]).toMatchObject({ targetTitle: 'Standing constraint' });
        expect(stored.edges.filter(edge => edge.targetId === solution.id)[0]).toMatchObject({ targetTitle: 'Proven solution' });
    });

    test('exposes the memos of a node in chronological order through graph-get-node', async () => {
        const graph = await addProject('Memo Read Project', 'Project used to read node memos');
        const node = await addNode(graph.id, 'TASK', 'Refund task', 'Process the refund flow');
        await addMemo(node.id, 'agent', 'note', 'The refund queue is saturated, retrying later');
        await addMemo(node.id, 'user', 'directive', 'The refund limit per customer is 500 per month');

        const fetched = await fetchNode(node.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.memos).toHaveLength(2);
        expect(stored.memos[0]).toMatchObject({
            author: 'agent',
            type: 'note',
            text: 'The refund queue is saturated, retrying later'
        });
        expect(stored.memos[1]).toMatchObject({
            author: 'user',
            type: 'directive',
            text: 'The refund limit per customer is 500 per month'
        });
    });

    test('exposes empty memos for a node without any recorded discussion', async () => {
        const graph = await addProject('Memo Empty Project', 'Project used to read a node without memos');
        const node = await addNode(graph.id, 'FACT', 'Standing fact', 'A fact with no discussion');

        const fetched = await fetchNode(node.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithMemos;
        expect(stored.memos).toEqual([]);
    });

    test('keeps memo timestamps out of tool responses', async () => {
        const graph = await addProject('Memo Stamps Project', 'Project used to check exposed memo fields');
        const node = await addNode(graph.id, 'TASK', 'Stamped task', 'Task used to check exposed fields');
        await addMemo(node.id, 'agent', 'note', 'A memo with a stamp that must not be exposed');

        const fetched = await fetchNode(node.id);
        expect(fetched.isError).toBeFalsy();
        expect(textOf(fetched)).not.toContain('createdAt');
        expect(textOf(fetched)).not.toContain('created_at');
        expect(textOf(fetched)).not.toContain('updatedAt');
        expect(textOf(fetched)).not.toContain('updated_at');
    });

    test('filters the memos of a node by a single type when types is provided', async () => {
        const graph = await addProject('Memo Type Filter Project', 'Project used to filter memos by type');
        const node = await addNode(graph.id, 'TASK', 'Filtered task', 'Task used to filter memos by type');
        await addMemo(node.id, 'agent', 'note', 'Progress on the filtered task');
        await addMemo(node.id, 'user', 'directive', 'The filtered task must keep the queue bounded');

        const result = await callTool('graph-get-node', { id: node.id, types: ['directive'] });
        expect(result.isError).toBeFalsy();

        const stored = JSON.parse(textOf(result)) as NodeWithMemos;
        expect(stored.memos).toHaveLength(1);
        expect(stored.memos[0]).toMatchObject({
            author: 'user',
            type: 'directive',
            text: 'The filtered task must keep the queue bounded'
        });
    });

    test('filters the memos of a node by several types at once', async () => {
        const graph = await addProject('Memo Multi Filter Project', 'Project used to filter memos by several types');
        const node = await addNode(graph.id, 'TASK', 'Multi filtered task', 'Task used to filter memos by several types');
        await addMemo(node.id, 'agent', 'note', 'An attempt that did not lead anywhere');
        await addMemo(node.id, 'user', 'resolution', 'The bounded queue solved the saturation');
        await addMemo(node.id, 'system', 'directive', 'The queue must stay bounded even under load');

        const result = await callTool('graph-get-node', { id: node.id, types: ['resolution', 'directive'] });
        expect(result.isError).toBeFalsy();

        const stored = JSON.parse(textOf(result)) as NodeWithMemos;
        expect(stored.memos).toHaveLength(2);
        expect(stored.memos[0]).toMatchObject({ type: 'resolution' });
        expect(stored.memos[1]).toMatchObject({ type: 'directive' });
    });

    test('refuses to filter the memos of a node with an empty types array', async () => {
        const graph = await addProject('Memo Empty Filter Project', 'Project used to reject an empty memo type filter');
        const node = await addNode(graph.id, 'TASK', 'Empty filtered task', 'Task used to reject an empty memo type filter');

        const result = await callTool('graph-get-node', { id: node.id, types: [] });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid arguments');
    });
});

import { mcpTestHarness } from './mcpHarness.ts';

const { addMemo, addNode, addProject, callTool, textOf } = mcpTestHarness();

describe('MCP server - graph-get-nodes', () => {
    test('lists the nodes of one graph sorted by the most recent first', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        const graph = await addProject('Panorama Project', 'Project used to list nodes');
        const otherGraph = await addProject('Other Graph', 'Graph that must not leak nodes');

        await addNode(otherGraph.id, 'GOAL', 'Other goal', 'Goal of the other graph');
        await addNode(graph.id, 'GOAL', 'First goal', 'First goal of the panorama');
        await sleep(5);
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

    test('updating a node bumps it to the most recent position', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const graph = await addProject('Bump Order Project', 'Project used to test bump ordering');
        const goal = await addNode(graph.id, 'GOAL', 'Linked goal', 'Goal linked from the task');
        const task = await addNode(graph.id, 'TASK', 'Linked task', 'Task linked to the goal');
        await sleep(5);
        const fresh = await addNode(graph.id, 'FACT', 'Fresh fact', 'Most recent node before the update');

        const bumped = await callTool('graph-update-node', { id: task.id, status: 'in_progress' });
        expect(bumped.isError).toBeFalsy();

        const result = await callTool('graph-get-nodes', { graphId: graph.id });
        expect(result.isError).toBeFalsy();

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; }[];
        const mostRecent = nodes[0];
        if (!mostRecent) {
            throw new Error('Expected at least one node in the list');
        }

        expect(mostRecent.id).toEqual(task.id);
        expect(nodes.map(node => node.id)).toEqual([task.id, fresh.id, goal.id]);
    });

    test('filters nodes by type and status', async () => {
        const graph = await addProject('Filter Project', 'Project used to filter nodes');
        const pendingTask = await addNode(graph.id, 'TASK', 'Pending task', 'Task still pending');
        const runningTask = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'TASK',
            title: 'Running task',
            description: 'Task in progress',
            status: 'in_progress'
        });
        await addNode(graph.id, 'GOAL', 'Pending goal', 'Goal still pending');
        expect(runningTask.isError).toBeFalsy();

        const result = await callTool('graph-get-nodes', {
            graphId: graph.id,
            type: 'TASK',
            status: 'pending'
        });
        expect(result.isError).toBeFalsy();

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; }[];
        expect(nodes).toHaveLength(1);
        expect(nodes[0]?.id).toEqual(pendingTask.id);
    });

    test('caps the node list with a limit, keeping the most recent first', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const graph = await addProject('Limit Project', 'Project used to limit nodes');
        await addNode(graph.id, 'TASK', 'First task', 'Oldest node');
        await sleep(5);
        const second = await addNode(graph.id, 'TASK', 'Second task', 'Middle node');
        await sleep(5);
        const third = await addNode(graph.id, 'TASK', 'Third task', 'Newest node');

        const result = await callTool('graph-get-nodes', { graphId: graph.id, limit: 2 });
        expect(result.isError).toBeFalsy();

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; }[];
        expect(nodes).toHaveLength(2);
        expect(nodes.map(node => node.id)).toEqual([third.id, second.id]);
    });

    test('returns an empty list when no node matches the filters', async () => {
        const graph = await addProject('Empty Filter Project', 'Project with a single node');
        await addNode(graph.id, 'TASK', 'Only task', 'The only node');

        const result = await callTool('graph-get-nodes', { graphId: graph.id, type: 'GOAL' });
        expect(result.isError).toBeFalsy();

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; }[];
        expect(nodes).toEqual([]);
    });

    test('refuses a node list with an invalid type filter', async () => {
        const graph = await addProject('Invalid Filter Project', 'Project used for an invalid filter');
        await addNode(graph.id, 'TASK', 'Some task', 'Some task description');

        const result = await callTool('graph-get-nodes', { graphId: graph.id, type: 'NOT_A_TYPE' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid arguments');
    });

    test('keeps memo discussions out of the node list', async () => {
        const graph = await addProject('Memo List Project', 'Project used to keep discussions out of the list');
        const node = await addNode(graph.id, 'TASK', 'Memoed task', 'Task with a recorded discussion');
        await addMemo(node.id, 'user', 'The clause that must never appear in a node list');

        const result = await callTool('graph-get-nodes', { graphId: graph.id });
        expect(result.isError).toBeFalsy();
        expect(textOf(result)).not.toContain('must never appear');

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; memos?: unknown; }[];
        expect(nodes[0]?.memos).toBeUndefined();
    });
});

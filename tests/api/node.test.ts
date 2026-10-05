import { randomUUID } from 'node:crypto';
import type { NodeWithEdges } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

type SearchHit = {
    node: { id: string; };
    titleScore: number;
    descriptionScore: number;
    score: number;
};

const { addNode, addProject, callTool, edgesCollection, fetchNode, nodesCollection, textOf } = mcpTestHarness();

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
        const updated = JSON.parse(textOf(result).slice(jsonStart)) as NodeWithEdges;
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

    test('replaces the whole edges list on update, an empty list clears edges', async () => {
        const graph = await addProject('Re-edge Project', 'Project used to replace edges', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Main goal', 'Main goal of the project');
        const related = await addNode(graph.id, 'FACT', 'Known fact', 'Established fact');
        const task = await addNode(graph.id, 'TASK', 'Dependent task', 'Task linked to the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);

        const relinked = await callTool('graph-update-node', {
            id: task.id,
            edges: [{ type: 'DERIVED_FROM', targetId: related.id }]
        });
        expect(relinked.isError).toBeFalsy();

        const replacedEdges = await edgesCollection.find({ source_id: task.id }).toArray();
        expect(replacedEdges).toHaveLength(1);
        expect(replacedEdges[0]).toMatchObject({ type: 'DERIVED_FROM', target_id: related.id });

        const cleared = await callTool('graph-update-node', { id: task.id, edges: [] });
        expect(cleared.isError).toBeFalsy();

        const remainingEdges = await edgesCollection.find({ source_id: task.id }).toArray();
        expect(remainingEdges).toHaveLength(0);
    });

    test('keeps edges when the update does not mention them', async () => {
        const graph = await addProject('Keep Edges Project', 'Project used to test edge preservation on update', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Main goal', 'Main goal of the project');
        const task = await addNode(graph.id, 'TASK', 'Linked task', 'Task linked to the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);

        const updated = await callTool('graph-update-node', { id: task.id, status: 'in_progress' });
        expect(updated.isError).toBeFalsy();

        const remainingEdges = await edgesCollection.find({ source_id: task.id }).toArray();
        expect(remainingEdges).toHaveLength(1);
        expect(remainingEdges[0]).toMatchObject({ type: 'PART_OF', target_id: goal.id });
    });

    test('allows two parallel edges of the same type and target carrying different memories', async () => {
        const graph = await addProject('Parallel Edges Project', 'Project used to test parallel edges', 'waiting_goal');
        const rule = await addNode(graph.id, 'USER_DECISION', 'First rule', 'First recorded rule');
        const task = await addNode(graph.id, 'TASK', 'Constrained task', 'Task with two constraints', [
            { type: 'CONSTRAINED_BY', targetId: rule.id, description: 'First memory' },
            { type: 'CONSTRAINED_BY', targetId: rule.id, description: 'Second memory' }
        ]);

        expect(task.edges).toHaveLength(2);

        const stored = await edgesCollection.find({ source_id: task.id }).toArray();
        expect(stored).toHaveLength(2);
        expect(stored.map(edge => edge.description).sort()).toEqual(['First memory', 'Second memory']);
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

    test('refuses update edges to a target node of another graph', async () => {
        const firstGraph = await addProject('First Update Graph', 'First graph', 'waiting_goal');
        const secondGraph = await addProject('Second Update Graph', 'Second graph', 'waiting_goal');
        const foreignNode = await addNode(firstGraph.id, 'GOAL', 'Foreign goal', 'Goal from another graph');
        const task = await addNode(secondGraph.id, 'TASK', 'Local task', 'Task of the second graph');

        const result = await callTool('graph-update-node', {
            id: task.id,
            edges: [{ type: 'RELATED_TO', targetId: foreignNode.id }]
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
            edges: []
        });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Graph not found');

        const saved = await nodesCollection.find({}).toArray();
        expect(saved).toHaveLength(0);
    });

    test('records an edge to a target node of the same graph', async () => {
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
        expect(storedTask).not.toHaveProperty('links');

        const edgeDocuments = await edgesCollection.find({ source_id: task.id }).toArray();
        expect(edgeDocuments).toHaveLength(1);
        expect(edgeDocuments[0]).toMatchObject({ type: 'PART_OF', target_id: goal.id, graph_id: graph.id });
    });

    test('refuses edges to a target node of another graph', async () => {
        const firstGraph = await addProject('First Graph', 'First graph', 'waiting_goal');
        const secondGraph = await addProject('Second Graph', 'Second graph', 'waiting_goal');
        const foreignNode = await addNode(firstGraph.id, 'GOAL', 'Foreign goal', 'Goal from another graph');

        const result = await callTool('graph-add-node', {
            graphId: secondGraph.id,
            type: 'TASK',
            title: 'Cross graph task',
            description: 'Task linking to a node of another graph',
            status: 'pending',
            edges: [{ type: 'RELATED_TO', targetId: foreignNode.id }]
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

        const fetched = JSON.parse(textOf(result)) as NodeWithEdges;
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

    test('keeps the description recorded on an edge', async () => {
        const graph = await addProject('Edge Memory Project', 'Project used to record edge memory', 'waiting_goal');
        const rule = await addNode(graph.id, 'USER_DECISION', 'Reimbursement rule', 'Only expenses under the daily limit are reimbursed');
        const task = await addNode(graph.id, 'TASK', 'Prepare expense report', 'Prepare the final expense report', [
            { type: 'CONSTRAINED_BY', targetId: rule.id, description: 'The daily limit rule applies because the report covers travel days' }
        ]);

        const fetched = await fetchNode(task.id);
        expect(fetched.isError).toBeFalsy();

        const stored = JSON.parse(textOf(fetched)) as NodeWithEdges;
        expect(stored.edges).toEqual([
            { type: 'CONSTRAINED_BY', targetId: rule.id, description: 'The daily limit rule applies because the report covers travel days' }
        ]);
    });

    test('refuses to delete a node that other nodes still refer to', async () => {
        const graph = await addProject('Delete Project', 'Project used to delete a node', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Removable goal', 'Goal that will be deleted');
        const task = await addNode(graph.id, 'TASK', 'Dependent task', 'Task linked to the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);

        const deleteResult = await callTool('graph-delete-node', { id: goal.id });

        expect(deleteResult.isError).toBe(true);
        expect(textOf(deleteResult)).toContain('is referenced by');
        expect(textOf(deleteResult)).toContain(task.id);

        const survivorFetch = await fetchNode(task.id);
        expect(survivorFetch.isError).toBeFalsy();

        const remaining = await fetchNode(goal.id);
        expect(remaining.isError).toBeFalsy();
    });

    test('refuses to delete a node that does not exist', async () => {
        const missingNodeId = '00000000-0000-4000-8000-000000000000';

        const result = await callTool('graph-delete-node', { id: missingNodeId });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Node not found');
    });

    test('deleting a node also removes its outgoing edges', async () => {
        const graph = await addProject('Orphan Project', 'Project used to test outgoing edge cleanup', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Orphan goal', 'Goal pointed at by the removed task');
        const task = await addNode(graph.id, 'TASK', 'Orphan source task', 'Task whose edges must be cleaned up', [
            { type: 'PART_OF', targetId: goal.id, description: 'Records how the goal was resolved' }
        ]);

        const result = await callTool('graph-delete-node', { id: task.id });

        expect(result.isError).toBeFalsy();

        const remainingEdges = await edgesCollection.find({}).toArray();
        expect(remainingEdges).toHaveLength(0);

        const remainingNodes = await nodesCollection.find({}).toArray();
        expect(remainingNodes).toHaveLength(1);
        expect(remainingNodes[0]).toMatchObject({ id: goal.id });
    });

    test('allows deleting a node whose referencer was deleted earlier', async () => {
        const graph = await addProject('Ghost Project', 'Project used to test ghost edge prevention', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Ghost goal', 'Goal referenced by a soon-removed task');
        const task = await addNode(graph.id, 'TASK', 'Ghost task', 'Task pointing at the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);

        const firstDelete = await callTool('graph-delete-node', { id: task.id });
        expect(firstDelete.isError).toBeFalsy();

        const secondDelete = await callTool('graph-delete-node', { id: goal.id });

        expect(secondDelete.isError).toBeFalsy();

        const remainingNodes = await nodesCollection.find({}).toArray();
        expect(remainingNodes).toHaveLength(0);

        const remainingEdges = await edgesCollection.find({}).toArray();
        expect(remainingEdges).toHaveLength(0);
    });

    test('replacing the edges of a node bumps it to the most recent position', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const graph = await addProject('Bump Order Project', 'Project used to test bump ordering', 'waiting_goal');
        const goal = await addNode(graph.id, 'GOAL', 'Linked goal', 'Goal linked from the task');
        const task = await addNode(graph.id, 'TASK', 'Linked task', 'Task linked to the goal', [
            { type: 'PART_OF', targetId: goal.id }
        ]);
        await sleep(5);
        const fresh = await addNode(graph.id, 'FACT', 'Fresh fact', 'Most recent node before the replace');

        const relinked = await callTool('graph-update-node', { id: task.id, edges: [] });
        expect(relinked.isError).toBeFalsy();

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
        const graph = await addProject('Filter Project', 'Project used to filter nodes', 'waiting_goal');
        const pendingTask = await addNode(graph.id, 'TASK', 'Pending task', 'Task still pending');
        const runningTask = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'TASK',
            title: 'Running task',
            description: 'Task in progress',
            status: 'in_progress',
            edges: []
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

        const graph = await addProject('Limit Project', 'Project used to limit nodes', 'waiting_goal');
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
        const graph = await addProject('Empty Filter Project', 'Project with a single node', 'waiting_goal');
        await addNode(graph.id, 'TASK', 'Only task', 'The only node');

        const result = await callTool('graph-get-nodes', { graphId: graph.id, type: 'GOAL' });
        expect(result.isError).toBeFalsy();

        const nodes = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as { id: string; }[];
        expect(nodes).toEqual([]);
    });

    test('refuses a node list with an invalid type filter', async () => {
        const graph = await addProject('Invalid Filter Project', 'Project used for an invalid filter', 'waiting_goal');
        await addNode(graph.id, 'TASK', 'Some task', 'Some task description');

        const result = await callTool('graph-get-nodes', { graphId: graph.id, type: 'NOT_A_TYPE' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid arguments');
    });

    test('ranks search results by similarity, penalizing reversed and repeated tokens', async () => {
        const graph = await addProject('Search Project', 'Project used to rank search results', 'waiting_goal');
        const exact = await addNode(graph.id, 'TASK', 'Carro, porta', 'Neutral description a');
        const repeated = await addNode(graph.id, 'TASK', 'Carro, Carro, porta', 'Neutral description b');
        const reversed = await addNode(graph.id, 'TASK', 'Porta, carro', 'Neutral description c');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'carro porta' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([exact.id, repeated.id, reversed.id]);
        expect(results[0]).toMatchObject({ titleScore: 1, descriptionScore: 0, score: 0.5 });
        expect(results[1]).toMatchObject({ titleScore: 0.8, descriptionScore: 0, score: 0.4 });
        expect(results[2]).toMatchObject({ titleScore: 0.5, descriptionScore: 0, score: 0.25 });
    });

    test('matches the description when the title does not contain the query', async () => {
        const graph = await addProject('Description Search Project', 'Project used to search descriptions', 'waiting_goal');
        const matched = await addNode(graph.id, 'FACT', 'Unrelated fact', 'A fact that matches the query in its description');
        await addNode(graph.id, 'OBSERVATION', 'Other observation', 'Another observation with nothing to match');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'query description' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.node.id).toEqual(matched.id);
        expect(results[0]?.titleScore).toEqual(0);
        expect(results[0]?.descriptionScore).toBeGreaterThan(0);
    });

    test('ignores diacritics on the query when matching a node', async () => {
        const graph = await addProject('Accent Search Project', 'Project used to search with accents', 'waiting_goal');
        const node = await addNode(graph.id, 'TASK', 'Meal benefit', 'Pagamento do vale refeicao mensal');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'refeição' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.node.id).toEqual(node.id);
        expect(results[0]?.titleScore).toEqual(0);
        expect(results[0]?.descriptionScore).toBeGreaterThan(0);
    });

    test('caps the search results with a limit', async () => {
        const graph = await addProject('Search Limit Project', 'Project used to limit search results', 'waiting_goal');
        const exact = await addNode(graph.id, 'TASK', 'Carro, porta', 'Description used for the limit check');
        const repeated = await addNode(graph.id, 'TASK', 'Carro, Carro, porta', 'Another description used for the limit check');
        await addNode(graph.id, 'TASK', 'Porta, carro', 'Third description used for the limit check');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'carro porta', limit: 2 });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([exact.id, repeated.id]);
    });

    test('breaks search ties by the most recently created node', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const graph = await addProject('Search Tie Project', 'Project used to break search ties', 'waiting_goal');
        const first = await addNode(graph.id, 'TASK', 'Tie task', 'Same description for both nodes');
        await sleep(5);
        const second = await addNode(graph.id, 'TASK', 'Tie task', 'Same description for both nodes');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'tie task' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([second.id, first.id]);
    });

    test('refuses search text that is empty after normalization', async () => {
        const graph = await addProject('Empty Search Project', 'Project used to reject an empty search', 'waiting_goal');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: '##' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('A non-empty search text is required');
    });

    test('fails the search when the graph does not exist', async () => {
        const result = await callTool('graph-search-nodes', { graphId: randomUUID(), text: 'anything' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Graph not found');
    });

    test('keeps node timestamps out of search results', async () => {
        const graph = await addProject('Stamped Search Project', 'Project used to check exposed fields on search', 'waiting_goal');
        await addNode(graph.id, 'TASK', 'Stamped search task', 'Search task with stamps');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'search task' });
        expect(result.isError).toBeFalsy();

        const text = textOf(result);
        expect(text).not.toContain('createdAt');
        expect(text).not.toContain('updatedAt');
        expect(text).not.toContain('created_at');
        expect(text).not.toContain('updated_at');
    });
});

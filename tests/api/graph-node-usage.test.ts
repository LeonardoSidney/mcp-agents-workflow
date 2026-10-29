import { ObjectId } from 'mongodb';
import type { RawNodeDocument } from '@adapters/gateways/mongoDbGateway.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, callTool, fetchNode, idOf, nodesCollection, textOf } = mcpTestHarness();

async function createNode (graphId: string, title: string, description: string): Promise<string> {
    const result = await callTool('graph-add-node', { graphId, type: 'DISCOVERY', title, description });
    if (result.isError) {
        throw new Error(`graph-add-node failed: ${textOf(result)}`);
    }

    return idOf(result);
}

async function storedNode (id: string): Promise<RawNodeDocument> {
    const stored = await nodesCollection.findOne({ _id: new ObjectId(id) });
    if (!stored) {
        throw new Error(`Expected the node to be stored: ${id}`);
    }

    return stored;
}

describe('MCP server - node usage counters', () => {
    test('starts a new node with zeroed counters and no usage timestamps', async () => {
        const graph = await addProject('Fresh Usage Project', 'Project used to verify initial counters');
        const id = await createNode(graph.id, 'Fresh node', 'Node never read');

        const stored = await storedNode(id);

        expect(stored).toMatchObject({ search_hit_count: 0, get_count: 0 });
        expect(stored.last_search_hit_at).toBeUndefined();
        expect(stored.last_get_at).toBeUndefined();
    });

    test('counts every graph-get-node and stamps the last get', async () => {
        const graph = await addProject('Get Usage Project', 'Project used to count gets');
        const id = await createNode(graph.id, 'Fetched node', 'Node read by id');

        await fetchNode(id);
        await fetchNode(id);

        const stored = await storedNode(id);
        expect(stored.get_count).toEqual(2);
        expect(stored.last_get_at).toBeInstanceOf(Date);
    });

    test('keeps updated_at untouched when a node is fetched', async () => {
        const graph = await addProject('Get Timestamp Project', 'Project used to keep updated_at on gets');
        const id = await createNode(graph.id, 'Fetched node', 'Node read by id');
        const before = await storedNode(id);

        await fetchNode(id);

        const after = await storedNode(id);
        expect(after.updated_at).toEqual(before.updated_at);
    });

    test('never exposes the counters in the graph-get-node output', async () => {
        const graph = await addProject('Get Output Project', 'Project used to hide counters from the model');
        const id = await createNode(graph.id, 'Fetched node', 'Node read by id');
        await fetchNode(id);

        const result = await fetchNode(id);

        const output = textOf(result);
        expect(output).not.toContain('get_count');
        expect(output).not.toContain('last_get_at');
        expect(output).not.toContain('search_hit_count');
        expect(output).not.toContain('last_search_hit_at');
    });

    test('counts a search hit on every node a search returns and stamps the last hit', async () => {
        const graph = await addProject('Search Usage Project', 'Project used to count search hits');
        const id = await createNode(graph.id, 'Invoice export pitfall', 'Export breaks on empty invoices');

        await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice' });
        await callTool('graph-search-nodes', { graphId: graph.id, text: 'export' });

        const stored = await storedNode(id);
        expect(stored.search_hit_count).toEqual(2);
        expect(stored.last_search_hit_at).toBeInstanceOf(Date);
    });

    test('does not count a search hit on nodes the search did not match', async () => {
        const graph = await addProject('Search Miss Project', 'Project used to skip unmatched nodes');
        const id = await createNode(graph.id, 'Gateway pitfall', 'Unrelated to the query');

        await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice' });

        const stored = await storedNode(id);
        expect(stored.search_hit_count).toEqual(0);
        expect(stored.last_search_hit_at).toBeUndefined();
    });

    test('does not count a search hit on matches cut by the limit', async () => {
        const graph = await addProject('Search Limit Project', 'Project used to skip matches beyond the limit');
        const best = await createNode(graph.id, 'Invoice export', 'Exact match');
        const cut = await createNode(graph.id, 'Invoice export retry backoff', 'Weaker match');

        await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice export', limit: 1 });

        expect((await storedNode(best)).search_hit_count).toEqual(1);
        expect((await storedNode(cut)).search_hit_count).toEqual(0);
    });

    test('counts a search hit on a path-only search', async () => {
        const graph = await addProject('Path Usage Project', 'Project used to count path search hits');
        const result = await callTool('graph-add-node', {
            graphId: graph.id,
            type: 'DISCOVERY',
            title: 'Tool schema pitfall',
            description: 'Anchored to the MCP tools',
            paths: ['src/mcp/nodeTools.ts']
        });
        const id = idOf(result);

        await callTool('graph-search-nodes', { graphId: graph.id, path: 'src/mcp' });

        expect((await storedNode(id)).search_hit_count).toEqual(1);
    });

    test('never exposes the counters in the graph-search-nodes output', async () => {
        const graph = await addProject('Search Output Project', 'Project used to hide counters from search output');
        await createNode(graph.id, 'Invoice export pitfall', 'Export breaks on empty invoices');
        await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice' });

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice' });

        const output = textOf(result);
        expect(output).not.toContain('search_hit_count');
        expect(output).not.toContain('last_search_hit_at');
    });

    test('does not count a get when graph-update-node reads the node internally', async () => {
        const graph = await addProject('Update Usage Project', 'Project used to skip internal reads');
        const id = await createNode(graph.id, 'Updated node', 'Node changed but never fetched');

        await callTool('graph-update-node', { id, status: 'completed' });

        expect((await storedNode(id)).get_count).toEqual(0);
    });

    test('does not count a get when graph-get-nodes lists the node', async () => {
        const graph = await addProject('List Usage Project', 'Project used to skip listings');
        const id = await createNode(graph.id, 'Listed node', 'Node only listed');

        await callTool('graph-get-nodes', { graphId: graph.id });

        expect((await storedNode(id)).get_count).toEqual(0);
    });
});

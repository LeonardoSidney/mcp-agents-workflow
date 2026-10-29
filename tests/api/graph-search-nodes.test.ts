import { mcpTestHarness } from './mcpHarness.ts';

type SearchHit = {
    node: { id: string; paths?: string[]; edges: { type: string; targetId: string; targetTitle?: string; }[]; };
    score?: number;
    bestMemo?: { author: string; type: string; text: string; };
    bestEdge?: { type: string; targetId: string; targetTitle?: string; description: string; };
};

const { addEdge, addMemo, addNode, addProject, callTool, idOf, textOf } = mcpTestHarness();

async function addAnchoredNode (graphId: string, title: string, paths: string[]): Promise<{ id: string; }> {
    const result = await callTool('graph-add-node', { graphId, type: 'DISCOVERY', title, description: `${title} details`, paths });
    if (result.isError) {
        throw new Error(`graph-add-node failed: ${textOf(result)}`);
    }

    return { id: idOf(result) };
}

describe('MCP server - graph-search-nodes', () => {
    test('ranks search results by similarity, penalizing reversed and repeated tokens', async () => {
        const graph = await addProject('Search Project', 'Project used to rank search results');
        const exact = await addNode(graph.id, 'TASK', 'Carro, porta', 'Neutral description a');
        const repeated = await addNode(graph.id, 'TASK', 'Carro, Carro, porta', 'Neutral description b');
        const reversed = await addNode(graph.id, 'TASK', 'Porta, carro', 'Neutral description c');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'carro porta' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([exact.id, repeated.id, reversed.id]);
        expect(results.map(hit => hit.score)).toEqual([0.33, 0.27, 0.17]);
    });

    test('returns only nodes that contain every query token (conjunctive AND)', async () => {
        const graph = await addProject('Conjunctive Search Project', 'Project used to verify AND token semantics');
        const partial = await addNode(graph.id, 'TASK', 'Invoice report', 'Only some of the query words');
        const complete = await addNode(graph.id, 'TASK', 'Meal benefit', 'Invoice report monthly cycle');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice report monthly' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([complete.id]);
        expect(results.map(hit => hit.node.id)).not.toContain(partial.id);
    });

    test('indexes the memory of a node outgoing edges in search', async () => {
        const graph = await addProject('Memory Search Project', 'Project used to search edge memories');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        const target = await addNode(graph.id, 'OBSERVATION', 'Other observation', 'No match in this one');
        await addEdge(graph.id, node.id, target.id, 'CONSTRAINED_BY', 'Constrained by the audit deadline');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'audit deadline' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([node.id]);
        expect(results[0]?.bestEdge).toEqual({
            type: 'CONSTRAINED_BY',
            targetId: target.id,
            targetTitle: 'Other observation',
            description: 'Constrained by the audit deadline'
        });
    });

    test('does not index incoming edge memory on the target node', async () => {
        const graph = await addProject('Incoming Memory Project', 'Project used to search incoming edge memories');
        const source = await addNode(graph.id, 'TASK', 'Source task', 'No match on the source');
        const target = await addNode(graph.id, 'OBSERVATION', 'Target observation', 'No match on the target');
        await addEdge(graph.id, source.id, target.id, 'DEPENDS_ON', 'Blocked by the database migration');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'database migration' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([source.id]);
    });

    test('omits bestEdge and bestMemo for a node matched only by its title', async () => {
        const graph = await addProject('No Memory Search Project', 'Project used to search nodes without memories');
        await addNode(graph.id, 'TASK', 'Invoice report', 'Nothing around it');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice report' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.bestEdge).toBeUndefined();
        expect(results[0]?.bestMemo).toBeUndefined();
    });

    test('indexes the memos of a node in search when no edge carries the match', async () => {
        const graph = await addProject('Memo Search Project', 'Project used to search node memos');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        await addNode(graph.id, 'TASK', 'Another task', 'Still nothing to match');
        await addMemo(node.id, 'user', 'directive', 'The reimbursement rule applies to this kind of task');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'reimbursement rule' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([node.id]);
        expect(results[0]?.bestMemo?.text).toEqual('The reimbursement rule applies to this kind of task');
        expect(results[0]?.bestEdge).toBeUndefined();
    });

    test('ranks a strong memory match above a weak title match', async () => {
        const graph = await addProject('Memory Rank Project', 'Project used to rank memory matches');
        const weakTitle = await addNode(graph.id, 'TASK', 'Invoice report export', 'No other words here');
        const strongMemory = await addNode(graph.id, 'TASK', 'Invoice report', 'Still not matching words');
        const target = await addNode(graph.id, 'OBSERVATION', 'Plain target node', 'No memory here at all');
        await addEdge(graph.id, strongMemory.id, target.id, 'SOLVED_BY', 'Invoice report export was validated by finance');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice report export' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([strongMemory.id, weakTitle.id]);
    });

    test('matches the description when the title does not contain the query', async () => {
        const graph = await addProject('Description Search Project', 'Project used to search descriptions');
        const matched = await addNode(graph.id, 'FACT', 'Unrelated fact', 'A fact that matches the query in its description');
        await addNode(graph.id, 'OBSERVATION', 'Other observation', 'Another observation with nothing to match');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'query description' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.node.id).toEqual(matched.id);
        expect(results[0]?.score).toBeGreaterThan(0);
    });

    test('ignores diacritics on the query when matching a node', async () => {
        const graph = await addProject('Accent Search Project', 'Project used to search with accents');
        const node = await addNode(graph.id, 'TASK', 'Meal benefit', 'Pagamento do vale refeicao mensal');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'refeição' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.node.id).toEqual(node.id);
        expect(results[0]?.score).toBeGreaterThan(0);
    });

    test('caps the search results with a limit', async () => {
        const graph = await addProject('Search Limit Project', 'Project used to limit search results');
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

        const graph = await addProject('Search Tie Project', 'Project used to break search ties');
        const first = await addNode(graph.id, 'TASK', 'Tie task', 'Same description for both nodes');
        await sleep(5);
        const second = await addNode(graph.id, 'TASK', 'Tie task', 'Same description for both nodes');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'tie task' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([second.id, first.id]);
    });

    test('refuses search text that is empty after normalization', async () => {
        const graph = await addProject('Empty Search Project', 'Project used to reject an empty search');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: '##' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('A non-empty search text is required');
    });

    test('fails the search when the graph does not exist', async () => {
        const result = await callTool('graph-search-nodes', { graphId: '0'.repeat(24), text: 'anything' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Graph not found');
    });

    test('keeps graphId, per-field scores and edge ids and descriptions out of search hits', async () => {
        const graph = await addProject('Lean Hit Project', 'Project used to check the lean hit shape');
        const node = await addNode(graph.id, 'TASK', 'Invoice export', 'Export of invoices');
        const target = await addNode(graph.id, 'SOLUTION', 'Finance validation', 'Validated by finance');
        await addEdge(graph.id, node.id, target.id, 'SOLVED_BY', 'Finance validated the totals');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'invoice export' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as Record<string, unknown>[];
        expect(Object.keys(results[0] ?? {})).toEqual(['node', 'score']);
        expect(Object.keys(results[0]?.['node'] ?? {})).not.toContain('graphId');
        expect(textOf(result)).not.toContain('titleScore');
        expect(textOf(result)).not.toContain('Finance validated the totals');

        const hits = results as SearchHit[];
        expect(hits[0]?.node.edges).toEqual([{ type: 'SOLVED_BY', targetId: target.id, targetTitle: 'Finance validation' }]);
    });

    test('surfaces bestEdge for a single-token match buried in a long edge description', async () => {
        const graph = await addProject('Long Edge Project', 'Project used to surface a weak but responsible edge');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        const target = await addNode(graph.id, 'QUESTION', 'Review question', 'No match here');
        const longDescription = 'This bug belongs to the same line of work as the ergonomics review of the search tool and its noisy results';
        await addEdge(graph.id, node.id, target.id, 'RELATED_TO', longDescription);

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'ergonomics' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results[0]?.bestEdge?.description).toEqual(longDescription);
    });

    test('omits bestEdge when the title already covers the query', async () => {
        const graph = await addProject('Title Over Edge Project', 'Project used to hide an edge the title made redundant');
        const node = await addNode(graph.id, 'TASK', 'Audit deadline', 'Plain description');
        const target = await addNode(graph.id, 'OBSERVATION', 'Plain target', 'No match here');
        await addEdge(graph.id, node.id, target.id, 'RELATED_TO', 'audit deadline');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'audit deadline' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results[0]?.bestEdge).toBeUndefined();
    });

    test('omits bestEdge when the memos already cover the query', async () => {
        const graph = await addProject('Memo Over Edge Project', 'Project used to prefer the memo over the edge');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        const target = await addNode(graph.id, 'OBSERVATION', 'Plain target', 'No match here');
        await addEdge(graph.id, node.id, target.id, 'RELATED_TO', 'audit deadline and other unrelated words');
        await addMemo(node.id, 'user', 'directive', 'audit deadline');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'audit deadline' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results[0]?.bestMemo?.text).toEqual('audit deadline');
        expect(results[0]?.bestEdge).toBeUndefined();
    });

    test('keeps node timestamps out of search results', async () => {
        const graph = await addProject('Stamped Search Project', 'Project used to check exposed fields on search');
        await addNode(graph.id, 'TASK', 'Stamped search task', 'Search task with stamps');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'search task' });
        expect(result.isError).toBeFalsy();

        const text = textOf(result);
        expect(text).not.toContain('createdAt');
        expect(text).not.toContain('updatedAt');
        expect(text).not.toContain('created_at');
        expect(text).not.toContain('updated_at');
    });

    test('surfaces the single best-matching memo of the node as bestMemo', async () => {
        const graph = await addProject('Best Memo Project', 'Project used to surface the best matching memo');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        await addMemo(node.id, 'user', 'resolution', 'The confidential reimbursement clause');
        await addMemo(node.id, 'agent', 'note', 'An unrelated note with no relevant words at all');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'confidential reimbursement' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([node.id]);
        expect(results[0]?.bestMemo).toEqual({ author: 'user', type: 'resolution', text: 'The confidential reimbursement clause' });
    });

    test('omits bestMemo when no memo matches the query', async () => {
        const graph = await addProject('Edge Only Search Project', 'Project used to check a hit without memos');
        const node = await addNode(graph.id, 'TASK', 'Carro, porta', 'Neutral description only');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'carro porta' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.node.id).toEqual(node.id);
        expect(results[0]?.bestMemo).toBeUndefined();
    });

    test('returns the full memo text when the best memo passes the floor', async () => {
        const graph = await addProject('Long Memo Search Project', 'Project used to verify full memo text exposure');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        const padding = Array.from({ length: 40 }, (_, index) => `padded${index}`).join(' ');
        const longText = `Audit deadline review board meets every single month ${padding}`;
        await addMemo(node.id, 'agent', 'resolution', longText);

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'audit deadline review board' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.node.id).toEqual(node.id);
        expect(results[0]?.bestMemo).toMatchObject({ author: 'agent' });
        expect(longText.length).toBeGreaterThan(240);
        expect(results[0]?.bestMemo?.text).toEqual(longText);
    });

    test('never indexes note memos in search', async () => {
        const graph = await addProject('Note Search Project', 'Project used to verify note memos are not indexed');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        await addMemo(node.id, 'agent', 'note', 'confidential reimbursement clause');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'confidential reimbursement' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(0);
    });

    test('skips note memos when surfacing the best memo', async () => {
        const graph = await addProject('Note Best Memo Project', 'Project used to verify note memos never surface as bestMemo');
        const node = await addNode(graph.id, 'TASK', 'Unrelated task title', 'Nothing to match here');
        await addMemo(node.id, 'agent', 'note', 'The confirmed confidential reimbursement clause');
        await addMemo(node.id, 'user', 'resolution', 'The confidential reimbursement clause was discussed');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'confidential reimbursement clause' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.bestMemo).toEqual({ author: 'user', type: 'resolution', text: 'The confidential reimbursement clause was discussed' });
    });

    test('finds the nodes anchored inside a directory when searching by path alone', async () => {
        const graph = await addProject('Path Search Project', 'Project used to search nodes by path');
        const inside = await addAnchoredNode(graph.id, 'Tool schema pitfall', ['src/mcp/nodeTools.ts']);
        await addAnchoredNode(graph.id, 'Gateway pitfall', ['src/adapters/gateways/mongoDbGateway.ts']);
        await addNode(graph.id, 'TASK', 'Unanchored task', 'Task without paths');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, path: 'src/mcp' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([inside.id]);
        expect(results[0]?.node.paths).toEqual(['src/mcp/nodeTools.ts']);
    });

    test('omits the scores from the hits of a path-only search', async () => {
        const graph = await addProject('Path Scores Project', 'Project used to verify path-only hits carry no scores');
        await addAnchoredNode(graph.id, 'Tool schema pitfall', ['src/mcp/nodeTools.ts']);

        const result = await callTool('graph-search-nodes', { graphId: graph.id, path: 'src/mcp' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as Record<string, unknown>[];
        expect(results).toHaveLength(1);
        expect(Object.keys(results[0] ?? {})).toEqual(['node']);
    });

    test('keeps the scores on the hits of a search combining path and text', async () => {
        const graph = await addProject('Path Text Scores Project', 'Project used to verify combined hits keep scores');
        await addAnchoredNode(graph.id, 'Tool schema pitfall', ['src/mcp/nodeTools.ts']);

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'schema', path: 'src/mcp' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results).toHaveLength(1);
        expect(results[0]?.score).toBeGreaterThan(0);
    });

    test('finds a directory node when searching by a file inside it', async () => {
        const graph = await addProject('Directory Node Project', 'Project used to match directory anchors');
        const directory = await addAnchoredNode(graph.id, 'Domain layer rule', ['src/domain']);

        const result = await callTool('graph-search-nodes', { graphId: graph.id, path: './src/domain/entities/node.ts' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([directory.id]);
    });

    test('combines path and text, returning only nodes matching both', async () => {
        const graph = await addProject('Path Text Project', 'Project used to combine path and text');
        const both = await addAnchoredNode(graph.id, 'Search ranking pitfall', ['src/application']);
        await addAnchoredNode(graph.id, 'Gateway ranking pitfall', ['src/adapters']);
        await addAnchoredNode(graph.id, 'Repository hydration', ['src/application']);

        const result = await callTool('graph-search-nodes', { graphId: graph.id, text: 'ranking', path: 'src/application' });
        expect(result.isError).toBeFalsy();

        const results = JSON.parse(textOf(result).slice(textOf(result).indexOf('['))) as SearchHit[];
        expect(results.map(hit => hit.node.id)).toEqual([both.id]);
    });

    test('refuses a search without text and without path', async () => {
        const graph = await addProject('Empty Search Project', 'Project used to reject empty searches');

        const result = await callTool('graph-search-nodes', { graphId: graph.id });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('A non-empty search text or path is required');
    });

    test('refuses an absolute search path', async () => {
        const graph = await addProject('Absolute Search Project', 'Project used to reject absolute search paths');

        const result = await callTool('graph-search-nodes', { graphId: graph.id, path: '/src/mcp' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('relative to the workspace root');
    });
});

import type { Memo } from '@domain/entities/memo.ts';
import type { NodeWithMemos } from '@domain/entities/node.ts';
import type { GraphSearchNodesServiceResponse, NodeSearchResult } from '@domain/services/iGraphSearchNodesService.ts';
import { GraphSearchNodesService } from '@application/services/graph/graphSearchNodesService.ts';

const now = new Date();

function expectScored (response: GraphSearchNodesServiceResponse): NodeSearchResult[] {
    expect(response.success).toBe(true);
    if (!response.success || !response.results) {
        throw new Error('Expected a successful scoring response with results');
    }

    return response.results;
}

function buildNode (partial: Partial<NodeWithMemos> & { id: string; title: string; }): NodeWithMemos {
    return {
        id: partial.id,
        graphId: 'graph-id',
        type: 'TASK',
        status: 'pending',
        title: partial.title,
        description: partial.description ?? '',
        createdAt: now,
        updatedAt: now,
        edges: partial.edges ?? [],
        memos: partial.memos ?? []
    };
}

describe('GraphSearchNodesService', () => {
    const service = new GraphSearchNodesService();

    const mockMemos: Memo[] = [
        { id: 'note', nodeId: 'n1', author: 'agent', type: 'note', text: 'ledger backup', createdAt: now },
        { id: 'resolution', nodeId: 'n1', author: 'user', type: 'resolution', text: 'invoice export', createdAt: now },
        { id: 'directive', nodeId: 'n1', author: 'system', type: 'directive', text: 'lint before merging', createdAt: now }
    ];

    const mockNode = buildNode({
        id: 'n1',
        title: 'harbor crane',
        description: 'quarterly harvest',
        memos: mockMemos
    });

    test('returns a validation error when the search text is empty after normalization', () => {
        const response = service.scoreNodes({ text: '  ## ', nodes: [] });

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error).toEqual('A non-empty search text is required');
        }
    });

    test('drops candidate nodes that do not contain every query token', () => {
        const matched = buildNode({ id: 'n1', title: 'Invoice report', description: '' });
        const unmatched = buildNode({ id: 'n2', title: 'Other task', description: 'Nothing to match here' });

        const response = service.scoreNodes({ text: 'invoice', nodes: [matched, unmatched] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('drops a node that matches some, but not every, query token', () => {
        const partial = buildNode({ id: 'n1', title: 'Invoice report', description: '' });
        const complete = buildNode({ id: 'n2', title: 'Meal benefit', description: 'Invoice report monthly cycle' });

        const response = service.scoreNodes({ text: 'invoice report monthly', nodes: [partial, complete] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n2']);
    });

    test('keeps a node that spreads the query tokens across different fields', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Invoice',
            description: '',
            memos: [{ id: 'm1', nodeId: 'n1', author: 'agent', type: 'resolution', text: 'Report monthly review', createdAt: now }]
        });

        const response = service.scoreNodes({ text: 'invoice report monthly', nodes: [node] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('penalizes reversed and repeated query tokens in the field', () => {
        const exact = buildNode({ id: 'n1', title: 'Carro, porta', description: '' });
        const repeated = buildNode({ id: 'n2', title: 'Carro, Carro, porta', description: '' });
        const reversed = buildNode({ id: 'n3', title: 'Porta, carro', description: '' });

        const response = service.scoreNodes({ text: 'carro porta', nodes: [exact, repeated, reversed] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1', 'n2', 'n3']);
        expect(results[0]).toMatchObject({ titleScore: 1, descriptionScore: 0, memoryScore: 0 });
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('scores memorized memos in the memoryScore field', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Unrelated task',
            description: '',
            memos: [{ id: 'm1', nodeId: 'n1', author: 'agent', type: 'resolution', text: 'audit deadline', createdAt: now }]
        });

        const response = service.scoreNodes({ text: 'audit deadline', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 0, memoryScore: 1 });
        expect(results[0]?.bestMemo).toMatchObject({ id: 'm1', author: 'agent', score: 1 });
    });

    test('never indexes note memos: a note-exclusive query cannot open the AND gate', () => {
        const response = service.scoreNodes({ text: 'ledger backup', nodes: [mockNode] });

        const results = expectScored(response);
        expect(results).toHaveLength(0);
    });

    test('surfaces a node when its title carries the query tokens', () => {
        const response = service.scoreNodes({ text: 'harbor crane', nodes: [mockNode] });

        const results = expectScored(response);
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ titleScore: 1, descriptionScore: 0, memoryScore: 0 });
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('surfaces a node when its description carries the query tokens', () => {
        const response = service.scoreNodes({ text: 'quarterly harvest', nodes: [mockNode] });

        const results = expectScored(response);
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 1, memoryScore: 0 });
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('surfaces a node when its resolution memo carries the query tokens', () => {
        const response = service.scoreNodes({ text: 'invoice export', nodes: [mockNode] });

        const results = expectScored(response);
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 0, memoryScore: 1 });
        expect(results[0]?.bestMemo).toMatchObject({ id: 'resolution', author: 'user', type: 'resolution', score: 1 });
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('surfaces a node when its directive memo carries the query tokens', () => {
        const response = service.scoreNodes({ text: 'lint before merging', nodes: [mockNode] });

        const results = expectScored(response);
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 0, memoryScore: 1 });
        expect(results[0]?.bestMemo).toMatchObject({ id: 'directive', author: 'system', type: 'directive', score: 1 });
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('splits the query across title and description, tying the exact single-field score', () => {
        const response = service.scoreNodes({ text: 'crane harvest', nodes: [mockNode] });

        const results = expectScored(response);
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ titleScore: 1 / 2, descriptionScore: 1 / 2, memoryScore: 0 });
        expect(results[0]?.bestMemo).toBeNull();
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('skips note memos when surfacing the best memo, even when they match better', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Unrelated task',
            description: '',
            memos: [
                { id: 'note', nodeId: 'n1', author: 'agent', type: 'note', text: 'audit deadline', createdAt: now },
                { id: 'resolution', nodeId: 'n1', author: 'user', type: 'resolution', text: 'the audit deadline was confirmed', createdAt: now }
            ]
        });

        const response = service.scoreNodes({ text: 'audit deadline', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]?.bestMemo?.id).toEqual('resolution');
        expect(results[0]?.bestMemo?.type).toEqual('resolution');
    });

    test('ranks each memo individually, so the best match wins over the whole discussion', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Unrelated task',
            description: '',
            memos: [
                {
                    id: 'm1',
                    nodeId: 'n1',
                    author: 'agent',
                    type: 'resolution',
                    text: 'A long discussion about a budget planning session that covered many unrelated topics',
                    createdAt: now
                },
                { id: 'm2', nodeId: 'n1', author: 'user', type: 'resolution', text: 'audit deadline', createdAt: now }
            ]
        });

        const response = service.scoreNodes({ text: 'audit deadline', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 0, memoryScore: 1 });
        expect(results[0]?.bestMemo).toMatchObject({ id: 'm2', author: 'user', score: 1 });
    });

    test('breaks a memo score tie toward the newest memo', () => {
        const older = new Date(now.getTime() - 60000);
        const node = buildNode({
            id: 'n1',
            title: 'Unrelated task',
            description: '',
            memos: [
                { id: 'older', nodeId: 'n1', author: 'agent', type: 'resolution', text: 'audit deadline', createdAt: older },
                { id: 'newer', nodeId: 'n1', author: 'user', type: 'resolution', text: 'audit deadline', createdAt: now }
            ]
        });

        const response = service.scoreNodes({ text: 'audit deadline', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]?.bestMemo?.id).toEqual('newer');
    });

    test('returns no best memo when only the edge description matches', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Unrelated task',
            description: '',
            edges: [{ id: 'e1', type: 'CONSTRAINED_BY', targetId: 't1', description: 'database migration' }]
        });

        const response = service.scoreNodes({ text: 'database migration', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]?.memoryScore).toEqual(1);
        expect(results[0]?.bestMemo).toBeNull();
    });

    test('scores outgoing edge descriptions in the memoryScore field', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Unrelated task',
            description: '',
            edges: [{ id: 'e1', type: 'CONSTRAINED_BY', targetId: 't1', description: 'database migration' }]
        });

        const response = service.scoreNodes({ text: 'database migration', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 0, memoryScore: 1 });
    });

    test('keeps memoryScore at zero for nodes without edges or memos', () => {
        const node = buildNode({ id: 'n1', title: 'Invoice report', description: '' });

        const response = service.scoreNodes({ text: 'invoice report', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]?.memoryScore).toEqual(0);
    });

    test('ignores diacritics on both the query and the node fields', () => {
        const node = buildNode({ id: 'n1', title: 'Refeição mensal', description: '' });

        const response = service.scoreNodes({ text: 'refeicao', nodes: [node] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('matches a singular query token against a plural field token', () => {
        const node = buildNode({ id: 'n1', title: 'Server instructions rewrite', description: '' });

        const response = service.scoreNodes({ text: 'instruction', nodes: [node] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('matches a plural query token against a singular field token', () => {
        const node = buildNode({ id: 'n1', title: 'Edge type guard', description: '' });

        const response = service.scoreNodes({ text: 'edges', nodes: [node] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('folds an -ies plural into its -y singular', () => {
        const node = buildNode({ id: 'n1', title: 'Search query fallback', description: '' });

        const response = service.scoreNodes({ text: 'queries', nodes: [node] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('folds an -sses plural into its -ss singular', () => {
        const node = buildNode({ id: 'n1', title: 'Process lifecycle', description: '' });

        const response = service.scoreNodes({ text: 'processes', nodes: [node] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('keeps tokens ending in -ss, -us or -is intact', () => {
        const node = buildNode({ id: 'n1', title: 'Clas statu analys', description: '' });

        const response = service.scoreNodes({ text: 'class status analysis', nodes: [node] });

        const results = expectScored(response);
        expect(results).toEqual([]);
    });

    test('keeps tokens of three characters or fewer intact', () => {
        const node = buildNode({ id: 'n1', title: 'Bu ga', description: '' });

        const response = service.scoreNodes({ text: 'bus gas', nodes: [node] });

        const results = expectScored(response);
        expect(results).toEqual([]);
    });

    test('keeps the full score when the query and the field differ only by plural form', () => {
        const node = buildNode({ id: 'n1', title: 'Memo types', description: '' });

        const response = service.scoreNodes({ text: 'memos type', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 1 });
    });

    test('dedupes repeated query tokens before scoring', () => {
        const node = buildNode({ id: 'n1', title: 'Carro porta', description: '' });

        const response = service.scoreNodes({ text: 'carro carro porta', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 1 });
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('scores node descriptions in the descriptionScore field', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Nothing to match here',
            description: 'audit deadline'
        });

        const response = service.scoreNodes({ text: 'audit deadline', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 1, memoryScore: 0 });
        expect(results[0]?.score).toEqual(1 / 3);
    });

    test('combines the three field scores with equal weight into the final score', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Invoice export',
            description: '',
            memos: [{ id: 'm1', nodeId: 'n1', author: 'user', type: 'resolution', text: 'invoice export', createdAt: now }]
        });

        const response = service.scoreNodes({ text: 'invoice export', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 1, descriptionScore: 0, memoryScore: 1 });
        expect(results[0]?.score).toEqual(2 / 3);
    });

    test('keeps a node in the AND gate when an edge without a description is present', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Unrelated task',
            description: '',
            edges: [
                { id: 'e1', type: 'CONSTRAINED_BY', targetId: 't1' },
                { id: 'e2', type: 'CONSTRAINED_BY', targetId: 't2', description: 'database migration' }
            ]
        });

        const response = service.scoreNodes({ text: 'database migration', nodes: [node] });

        const results = expectScored(response);
        expect(results.map(result => result.node.id)).toEqual(['n1']);
    });

    test('scores outgoing edges only from the ones that carry a description', () => {
        const node = buildNode({
            id: 'n1',
            title: 'Invoice report',
            description: '',
            edges: [
                { id: 'e1', type: 'CONSTRAINED_BY', targetId: 't1' },
                { id: 'e2', type: 'CONSTRAINED_BY', targetId: 't2', description: 'unrelated task' }
            ]
        });

        const response = service.scoreNodes({ text: 'invoice report', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 1, descriptionScore: 0, memoryScore: 0 });
        expect(results[0]?.bestMemo).toBeNull();
    });
});


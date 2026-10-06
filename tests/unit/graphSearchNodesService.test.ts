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

    test('returns a validation error when the search text is empty after normalization', () => {
        const response = service.scoreNodes({ text: '  ## ', nodes: [] });

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error).toEqual('A non-empty search text is required');
        }
    });

    test('drops candidate nodes that do not match any field', () => {
        const matched = buildNode({ id: 'n1', title: 'Invoice report', description: '' });
        const unmatched = buildNode({ id: 'n2', title: 'Other task', description: 'Nothing to match here' });

        const response = service.scoreNodes({ text: 'invoice', nodes: [matched, unmatched] });

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
            memos: [{ id: 'm1', nodeId: 'n1', author: 'agent', text: 'audit deadline', createdAt: now }]
        });

        const response = service.scoreNodes({ text: 'audit deadline', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 0, descriptionScore: 0, memoryScore: 1 });
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
            memos: [{ id: 'm1', nodeId: 'n1', author: 'user', text: 'invoice export', createdAt: now }]
        });

        const response = service.scoreNodes({ text: 'invoice export', nodes: [node] });

        const results = expectScored(response);
        expect(results[0]).toMatchObject({ titleScore: 1, descriptionScore: 0, memoryScore: 1 });
        expect(results[0]?.score).toEqual(2 / 3);
    });
});


import type { Edge } from '@domain/entities/edge.ts';
import { toEdgeReference } from '@domain/entities/edge.ts';

const baseEdge: Edge = {
    id: '3f9c1a2b4d5e6f708192a3b4',
    graphId: '1a2b3c4d5e6f708192a3b4c5',
    sourceId: '9e8d7c6b5a4938271605f4e3',
    targetId: '5d4c3b2a1908f7e6d5c4b3a2',
    type: 'SOLVED_BY'
};

describe('toEdgeReference', () => {
    test('maps an edge to a reference without a target title', () => {
        const reference = toEdgeReference(baseEdge);

        expect(reference).toEqual({
            id: baseEdge.id,
            type: 'SOLVED_BY',
            targetId: baseEdge.targetId,
            description: undefined
        });
        expect(reference.targetTitle).toBeUndefined();
    });

    test('carries the edge description when present', () => {
        const reference = toEdgeReference({ ...baseEdge, description: 'How the target was resolved' });

        expect(reference).toMatchObject({ description: 'How the target was resolved' });
    });
});

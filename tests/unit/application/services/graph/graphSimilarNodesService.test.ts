import type { Node } from '@domain/entities/node.ts';
import { GraphNodeAnchorService } from '@application/services/graph/graphNodeAnchorService.ts';
import { GraphSimilarNodesService } from '@application/services/graph/graphSimilarNodesService.ts';

const now = new Date();

function buildNode (partial: Partial<Node> & { id: string; title: string; }): Node {
    return {
        id: partial.id,
        graphId: 'graph-id',
        type: partial.type ?? 'SOLUTION',
        status: 'completed',
        title: partial.title,
        description: 'description',
        paths: partial.paths ?? [],
        createdAt: now,
        updatedAt: now
    };
}

describe('GraphSimilarNodesService', () => {
    const service = new GraphSimilarNodesService(new GraphNodeAnchorService());

    test('flags a same-type node sharing at least two meaningful title tokens', () => {
        const node = buildNode({ id: 'new', title: 'graph-get-project by name + unique project names on graph-add' });
        const existing = buildNode({ id: 'old', title: 'P0-2: get-project by exact name + unique project names in graph-add' });

        const similar = service.findSimilar({ node, candidates: [existing] });

        expect(similar.map(candidate => candidate.id)).toEqual(['old']);
    });

    test('ignores a node of another type even with the same title', () => {
        const node = buildNode({ id: 'new', type: 'SOLUTION', title: 'Lean search output' });
        const existing = buildNode({ id: 'old', type: 'TASK', title: 'Lean search output' });

        const similar = service.findSimilar({ node, candidates: [existing] });

        expect(similar).toEqual([]);
    });

    test('ignores a node whose shared tokens are a small part of both titles', () => {
        const node = buildNode({ id: 'new', title: 'graph-add-node lists similar same-type nodes' });
        const existing = buildNode({ id: 'old', title: 'graph-get-nodes types list replaces single type filter' });

        const similar = service.findSimilar({ node, candidates: [existing] });

        expect(similar).toEqual([]);
    });

    test('ignores a node sharing a single meaningful title token', () => {
        const node = buildNode({ id: 'new', title: 'Search plural folding' });
        const existing = buildNode({ id: 'old', title: 'Search ranking ties' });

        const similar = service.findSimilar({ node, candidates: [existing] });

        expect(similar).toEqual([]);
    });

    test('does not count stopwords and short tokens as shared', () => {
        const node = buildNode({ id: 'new', title: 'The rule for an id on the gateway' });
        const existing = buildNode({ id: 'old', title: 'The rule for an id in the memo' });

        const similar = service.findSimilar({ node, candidates: [existing] });

        expect(similar).toEqual([]);
    });

    test('matches plural and singular title tokens', () => {
        const node = buildNode({ id: 'new', title: 'Memo types reclassification' });
        const existing = buildNode({ id: 'old', title: 'Memo type reclassifications' });

        const similar = service.findSimilar({ node, candidates: [existing] });

        expect(similar.map(candidate => candidate.id)).toEqual(['old']);
    });

    test('flags a same-type node anchored to overlapping paths despite a different title', () => {
        const node = buildNode({ id: 'new', title: 'Zod strips unknown keys', paths: ['src/mcp/nodeTools.ts'] });
        const existing = buildNode({ id: 'old', title: 'Tool schema pitfall', paths: ['src/mcp'] });

        const similar = service.findSimilar({ node, candidates: [existing] });

        expect(similar.map(candidate => candidate.id)).toEqual(['old']);
    });

    test('never lists the node itself', () => {
        const node = buildNode({ id: 'same', title: 'Lean search output' });

        const similar = service.findSimilar({ node, candidates: [node] });

        expect(similar).toEqual([]);
    });

    test('ranks the closest titles first and caps the list at three', () => {
        const node = buildNode({ id: 'new', title: 'invoice export finance validation report' });
        const candidates = [
            buildNode({ id: 'half', title: 'invoice export finance retry' }),
            buildNode({ id: 'same', title: 'invoice export finance validation report' }),
            buildNode({ id: 'mostly', title: 'invoice export finance report cache' }),
            buildNode({ id: 'closer', title: 'invoice export finance validation' })
        ];

        const similar = service.findSimilar({ node, candidates });

        expect(similar.map(candidate => candidate.id)).toEqual(['same', 'closer', 'mostly']);
    });
});

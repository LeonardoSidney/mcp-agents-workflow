import type { ILogger } from '@domain/logger.ts';
import type { Edge } from '@domain/entities/edge.ts';
import type { DeleteEdgeRepositoryParams, IEdgeRepository } from '@domain/repository/iEdgeRepository.ts';
import { GraphDeleteEdgeUseCase } from '@application/use-cases/graph/graphDeleteEdgeUseCase.ts';

type EdgeRepositoryStub = {
    repository: IEdgeRepository;
    deleteEdgeCalls: DeleteEdgeRepositoryParams[];
};

function buildLogger (): ILogger {
    return {
        info: () => undefined
    };
}

function buildEdge (partial: Partial<Edge> & { id: string; }): Edge {
    return {
        id: partial.id,
        graphId: partial.graphId ?? 'graph-id',
        sourceId: partial.sourceId ?? 'n1',
        targetId: partial.targetId ?? 'n2',
        type: partial.type ?? 'PART_OF',
        description: partial.description
    };
}

function buildEdgeRepository (options: { edge: Edge | null; targetEdges: Edge[]; deleted: boolean; }): EdgeRepositoryStub {
    const deleteEdgeCalls: DeleteEdgeRepositoryParams[] = [];

    const repository: IEdgeRepository = {
        addEdge: async () => {
            throw new Error('Unexpected call: addEdge');
        },
        getEdge: async () => options.edge,
        updateEdge: async () => {
            throw new Error('Unexpected call: updateEdge');
        },
        deleteEdge: async (params: DeleteEdgeRepositoryParams) => {
            deleteEdgeCalls.push(params);
            return options.deleted;
        },
        listEdgesBySource: async () => {
            throw new Error('Unexpected call: listEdgesBySource');
        },
        listEdgesByTarget: async () => options.targetEdges
    };

    return { repository, deleteEdgeCalls };
}

describe('GraphDeleteEdgeUseCase', () => {
    const edge = buildEdge({ id: 'e1' });

    test('refuses to delete an edge that is the only reference to its target node', async () => {
        const stub = buildEdgeRepository({ edge, targetEdges: [edge], deleted: true });
        const useCase = new GraphDeleteEdgeUseCase(buildLogger(), stub.repository);

        const response = await useCase.execute({ id: edge.id });

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error).toContain(edge.targetId);
        }

        expect(stub.deleteEdgeCalls).toHaveLength(0);
    });

    test('deletes the edge when another edge still references its target node', async () => {
        const otherEdge = buildEdge({ id: 'e2', sourceId: 'n3' });
        const stub = buildEdgeRepository({ edge, targetEdges: [edge, otherEdge], deleted: true });
        const useCase = new GraphDeleteEdgeUseCase(buildLogger(), stub.repository);

        const response = await useCase.execute({ id: edge.id });

        expect(response.success).toBe(true);
        expect(stub.deleteEdgeCalls).toEqual([{ graphId: edge.graphId, id: edge.id }]);
    });

    test('returns an error when the edge does not exist', async () => {
        const stub = buildEdgeRepository({ edge: null, targetEdges: [edge], deleted: true });
        const useCase = new GraphDeleteEdgeUseCase(buildLogger(), stub.repository);

        const response = await useCase.execute({ id: 'unknown-id' });

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error).toEqual('Edge not found: unknown-id');
        }

        expect(stub.deleteEdgeCalls).toHaveLength(0);
    });

    test('returns an error when the edge id is empty', async () => {
        const stub = buildEdgeRepository({ edge: null, targetEdges: [], deleted: true });
        const useCase = new GraphDeleteEdgeUseCase(buildLogger(), stub.repository);

        const response = await useCase.execute({ id: '  ' });

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error).toEqual('A non-empty edge id is required');
        }

        expect(stub.deleteEdgeCalls).toHaveLength(0);
    });

    test('returns an error when the persistence layer deletes nothing', async () => {
        const otherEdge = buildEdge({ id: 'e2', sourceId: 'n3' });
        const stub = buildEdgeRepository({ edge, targetEdges: [edge, otherEdge], deleted: false });
        const useCase = new GraphDeleteEdgeUseCase(buildLogger(), stub.repository);

        const response = await useCase.execute({ id: edge.id });

        expect(response.success).toBe(false);
        if (!response.success) {
            expect(response.error).toEqual(`Edge not found: ${edge.id}`);
        }

        expect(stub.deleteEdgeCalls).toHaveLength(1);
    });
});

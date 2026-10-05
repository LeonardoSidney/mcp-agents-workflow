import type { Edge } from '@domain/entities/edge.ts';

export interface IEdgeRepository {
    addEdge (params: AddEdgeRepositoryParams): Promise<void>;
    getEdge (params: GetEdgeRepositoryParams): Promise<Edge | null>;
    updateEdge (params: UpdateEdgeRepositoryParams): Promise<boolean>;
    deleteEdge (params: DeleteEdgeRepositoryParams): Promise<boolean>;
    listEdgesBySource (params: ListEdgesBySourceRepositoryParams): Promise<Edge[]>;
    listEdgesByTarget (params: ListEdgesByTargetRepositoryParams): Promise<Edge[]>;
}

export type AddEdgeRepositoryParams = {
    edge: Edge;
};

export type GetEdgeRepositoryParams = {
    id: string;
};

export type UpdateEdgeRepositoryParams = {
    edge: Edge;
};

export type DeleteEdgeRepositoryParams = {
    graphId: string;
    id: string;
};

export type ListEdgesBySourceRepositoryParams = {
    graphId: string;
    sourceId: string;
};

export type ListEdgesByTargetRepositoryParams = {
    graphId: string;
    targetId: string;
};

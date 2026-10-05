import type { EdgeType } from '@domain/constants/edge-types.ts';

export type Edge = {
    id: string;
    graphId: string;
    sourceId: string;
    targetId: string;
    type: EdgeType;
    description?: string;
};

export type EdgeReference = {
    id: string;
    type: EdgeType;
    targetId: string;
    description?: string;
};

export function toEdgeReference (edge: Edge): EdgeReference {
    return {
        id: edge.id,
        type: edge.type,
        targetId: edge.targetId,
        description: edge.description
    };
}

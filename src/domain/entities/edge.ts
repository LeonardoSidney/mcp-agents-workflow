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
    targetTitle?: string;
    description?: string;
};

export type EdgeBrief = {
    type: EdgeType;
    targetId: string;
    targetTitle?: string;
};

export type EdgeMatch = {
    type: EdgeType;
    targetId: string;
    targetTitle?: string;
    description: string;
    score: number;
};

export function toEdgeReference (edge: Edge): EdgeReference {
    return {
        id: edge.id,
        type: edge.type,
        targetId: edge.targetId,
        description: edge.description
    };
}

export function toEdgeBrief (reference: EdgeReference): EdgeBrief {
    const brief: EdgeBrief = {
        type: reference.type,
        targetId: reference.targetId
    };

    if (reference.targetTitle !== undefined) {
        brief.targetTitle = reference.targetTitle;
    }

    return brief;
}

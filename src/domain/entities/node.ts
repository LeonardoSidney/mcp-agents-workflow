import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { EdgeReference } from '@domain/entities/edge.ts';

export type Node = {
    id: string;
    graphId: string;
    type: NodeType;
    status: NodeStatus;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
};

export type NodeWithEdges = Node & {
    edges: EdgeReference[];
};

export type NodeSummary = Pick<Node, 'id' | 'graphId' | 'type' | 'status' | 'title' | 'description'> & {
    edges: EdgeReference[];
};

export function toNodeSummary (node: NodeWithEdges): NodeSummary {
    return {
        id: node.id,
        graphId: node.graphId,
        type: node.type,
        status: node.status,
        title: node.title,
        description: node.description,
        edges: node.edges
    };
}

import type { EdgeType } from '@domain/constants/edge-types.ts';
import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';

export type NodeLink = {
    type: EdgeType;
    targetId: string;
};

export type Node = {
    id: string;
    graphId: string;
    type: NodeType;
    status: NodeStatus;
    title: string;
    description: string;
    links: NodeLink[];
    createdAt: Date;
    updatedAt: Date;
};

export type NodeSummary = Pick<Node, 'id' | 'graphId' | 'type' | 'status' | 'title' | 'description' | 'links'>;

export function toNodeSummary (node: Node): NodeSummary {
    return {
        id: node.id,
        graphId: node.graphId,
        type: node.type,
        status: node.status,
        title: node.title,
        description: node.description,
        links: node.links
    };
}

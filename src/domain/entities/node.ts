import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { EdgeReference } from '@domain/entities/edge.ts';
import type { Memo, MemoSummary } from '@domain/entities/memo.ts';
import { toMemoSummary } from '@domain/entities/memo.ts';

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

export type NodeWithMemos = Node & {
    edges: EdgeReference[];
    memos: Memo[];
};

export type NodeSummary = Pick<Node, 'id' | 'graphId' | 'type' | 'status' | 'title' | 'description'>;

export type NodeSummaryWithMemos = NodeSummary & {
    edges: EdgeReference[];
    memos: MemoSummary[];
};

export function toNodeSummary (node: Node): NodeSummary {
    return {
        id: node.id,
        graphId: node.graphId,
        type: node.type,
        status: node.status,
        title: node.title,
        description: node.description
    };
}

export function toNodeSummaryWithMemos (node: NodeWithMemos): NodeSummaryWithMemos {
    return {
        ...toNodeSummary(node),
        edges: node.edges,
        memos: node.memos.map(toMemoSummary)
    };
}

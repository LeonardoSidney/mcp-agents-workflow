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
};

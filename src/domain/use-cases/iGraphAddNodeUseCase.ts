import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { Node, NodeLink } from '@domain/entities/node.ts';

export interface IGraphAddNodeUseCase {
    execute (params: GraphAddNodeUseCaseParams): Promise<GraphAddNodeUseCaseResponse>;
}

export type GraphAddNodeUseCaseParams = {
    graphId: string;
    type: NodeType;
    title: string;
    description: string;
    status: NodeStatus;
    links: NodeLink[];
};

export type GraphAddNodeUseCaseResponse = {
    success: boolean;
    node?: Node;
    error?: string;
};

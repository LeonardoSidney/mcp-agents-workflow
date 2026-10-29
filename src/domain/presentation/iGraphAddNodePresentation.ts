import type { Node, NodeSummary } from '@domain/entities/node.ts';

export interface IGraphAddNodePresentation {
    present (params: GraphAddNodePresentationParams): GraphAddNodePresentationResult;
}

export type GraphAddNodePresentationParams = {
    node: Node;
    similarNodes: Node[];
};

export type GraphAddNodePresentationResult = {
    node: NodeSummary;
    similarNodesNotice?: string;
};

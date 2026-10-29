import type { NodeBrief, NodeWithEdges } from '@domain/entities/node.ts';

export interface IGraphGetNodesPresentation {
    presentNodes (params: GraphGetNodesPresentationParams): NodeBrief[];
}

export type GraphGetNodesPresentationParams = {
    nodes: NodeWithEdges[];
};

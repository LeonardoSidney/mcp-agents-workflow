import type { NodeBrief } from '@domain/entities/node.ts';
import { toNodeBrief } from '@domain/entities/node.ts';
import type { GraphGetNodesPresentationParams, IGraphGetNodesPresentation } from '@domain/presentation/iGraphGetNodesPresentation.ts';

export class GraphGetNodesPresentation implements IGraphGetNodesPresentation {
    presentNodes (params: GraphGetNodesPresentationParams): NodeBrief[] {
        return params.nodes.map(node => toNodeBrief(node));
    }
}

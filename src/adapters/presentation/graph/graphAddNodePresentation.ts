import type { Node } from '@domain/entities/node.ts';
import { toNodeSummary } from '@domain/entities/node.ts';
import type { GraphAddNodePresentationParams, GraphAddNodePresentationResult, IGraphAddNodePresentation } from '@domain/presentation/iGraphAddNodePresentation.ts';

export class GraphAddNodePresentation implements IGraphAddNodePresentation {
    present (params: GraphAddNodePresentationParams): GraphAddNodePresentationResult {
        const node = toNodeSummary(params.node);
        if (params.similarNodes.length === 0) {
            return { node };
        }

        return {
            node,
            similarNodesNotice: this.similarNodesNotice(params.node, params.similarNodes)
        };
    }

    private similarNodesNotice (node: Node, similarNodes: Node[]): string {
        const listed = similarNodes.map(similar => `${similar.id} "${similar.title}"`).join('; ');

        return `Similar existing ${node.type} nodes, check for a duplicate: ${listed}`;
    }
}

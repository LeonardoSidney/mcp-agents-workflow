import { isEdgeType } from '@domain/guards/edge-type.ts';
import { isNodeStatus } from '@domain/guards/node-status.ts';
import type { Node } from '@domain/entities/node.ts';
import type { GraphUpdateNodeServiceParams, GraphUpdateNodeServiceResponse, IGraphUpdateNodeService } from '@domain/services/iGraphUpdateNodeService.ts';

export class GraphUpdateNodeService implements IGraphUpdateNodeService {
    mapUpdate (params: GraphUpdateNodeServiceParams): GraphUpdateNodeServiceResponse {
        const validationError = this.validate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const { node } = params;
        const title = params.title ?? node.title;
        const description = params.description ?? node.description;
        const status = params.status ?? node.status;
        const links = params.links ?? node.links;

        const updated: Node = {
            id: node.id,
            graphId: node.graphId,
            type: node.type,
            status,
            title,
            description,
            links
        };

        return {
            success: true,
            node: updated
        };
    }

    private validate (params: GraphUpdateNodeServiceParams): string | undefined {
        if (params.status !== undefined && !isNodeStatus(params.status)) {
            return 'Invalid node status';
        }

        for (const link of params.links ?? []) {
            if (!isEdgeType(link.type)) {
                return 'Invalid link edge type';
            }
        }

        return undefined;
    }
}

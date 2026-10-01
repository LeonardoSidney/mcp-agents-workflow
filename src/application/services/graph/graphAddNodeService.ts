import { randomUUID } from 'node:crypto';
import { isEdgeType } from '@domain/guards/edge-type.ts';
import { isNodeStatus } from '@domain/guards/node-status.ts';
import { isNodeType } from '@domain/guards/node-type.ts';
import type { Node } from '@domain/entities/node.ts';
import type { GraphAddNodeServiceParams, GraphAddNodeServiceResponse, IGraphAddNodeService } from '@domain/services/iGraphAddNodeService.ts';

export class GraphAddNodeService implements IGraphAddNodeService {
    mapNode (params: GraphAddNodeServiceParams): GraphAddNodeServiceResponse {
        const validationError = this.validate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const now = new Date();

        const node: Node = {
            id: randomUUID(),
            graphId: params.graphId,
            type: params.type,
            status: params.status,
            title: params.title,
            description: params.description,
            links: params.links,
            createdAt: now,
            updatedAt: now
        };

        return {
            success: true,
            node
        };
    }

    private validate (params: GraphAddNodeServiceParams): string | undefined {
        if (!isNodeType(params.type)) {
            return 'Invalid node type';
        }

        if (!isNodeStatus(params.status)) {
            return 'Invalid node status';
        }

        for (const link of params.links) {
            if (!isEdgeType(link.type)) {
                return 'Invalid link edge type';
            }
        }

        return undefined;
    }
}

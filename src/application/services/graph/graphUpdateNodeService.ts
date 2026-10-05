import { randomUUID } from 'node:crypto';
import { isEdgeType } from '@domain/guards/edge-type.ts';
import { isNodeStatus } from '@domain/guards/node-status.ts';
import type { Edge } from '@domain/entities/edge.ts';
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
        const now = new Date();
        const title = params.title ?? node.title;
        const description = params.description ?? node.description;
        const status = params.status ?? node.status;

        const updated: Node = {
            id: node.id,
            graphId: node.graphId,
            type: node.type,
            status,
            title,
            description,
            createdAt: node.createdAt,
            updatedAt: now
        };

        let edges: Edge[] | undefined;
        if (params.edges !== undefined) {
            edges = params.edges.map(edge => ({
                id: randomUUID(),
                graphId: node.graphId,
                sourceId: node.id,
                targetId: edge.targetId,
                type: edge.type,
                description: edge.description
            }));
        }

        return {
            success: true,
            node: updated,
            edges
        };
    }

    private validate (params: GraphUpdateNodeServiceParams): string | undefined {
        if (params.status !== undefined && !isNodeStatus(params.status)) {
            return 'Invalid node status';
        }

        for (const edge of params.edges ?? []) {
            if (!isEdgeType(edge.type)) {
                return 'Invalid edge type';
            }
        }

        return undefined;
    }
}

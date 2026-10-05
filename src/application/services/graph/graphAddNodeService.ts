import { randomUUID } from 'node:crypto';
import { isEdgeType } from '@domain/guards/edge-type.ts';
import { isNodeStatus } from '@domain/guards/node-status.ts';
import { isNodeType } from '@domain/guards/node-type.ts';
import type { Edge } from '@domain/entities/edge.ts';
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

        const nodeId = randomUUID();

        const node: Node = {
            id: nodeId,
            graphId: params.graphId,
            type: params.type,
            status: params.status,
            title: params.title,
            description: params.description,
            createdAt: now,
            updatedAt: now
        };

        const edges: Edge[] = params.edges.map(edge => ({
            id: randomUUID(),
            graphId: params.graphId,
            sourceId: nodeId,
            targetId: edge.targetId,
            type: edge.type,
            description: edge.description
        }));

        return {
            success: true,
            node,
            edges
        };
    }

    private validate (params: GraphAddNodeServiceParams): string | undefined {
        if (!isNodeType(params.type)) {
            return 'Invalid node type';
        }

        if (!isNodeStatus(params.status)) {
            return 'Invalid node status';
        }

        for (const edge of params.edges) {
            if (!isEdgeType(edge.type)) {
                return 'Invalid edge type';
            }
        }

        return undefined;
    }
}

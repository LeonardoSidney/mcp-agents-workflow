import { randomUUID } from 'node:crypto';
import { isEdgeType } from '@domain/guards/edge-type.ts';
import type { Edge } from '@domain/entities/edge.ts';
import type { GraphAddEdgeServiceParams, GraphAddEdgeServiceResponse, GraphUpdateEdgeServiceParams, GraphUpdateEdgeServiceResponse, IGraphAddEdgeService, IGraphUpdateEdgeService } from '@domain/services/iGraphEdgeService.ts';

export class GraphEdgeService implements IGraphAddEdgeService, IGraphUpdateEdgeService {
    mapEdge (params: GraphAddEdgeServiceParams): GraphAddEdgeServiceResponse {
        const validationError = this.validateAdd(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const edge: Edge = {
            id: randomUUID(),
            graphId: params.graphId,
            sourceId: params.sourceId,
            targetId: params.targetId,
            type: params.type,
            description: params.description
        };

        return {
            success: true,
            edge
        };
    }

    mapEdgeUpdate (params: GraphUpdateEdgeServiceParams): GraphUpdateEdgeServiceResponse {
        const validationError = this.validateUpdate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const type = params.type ?? params.edge.type;
        const description = params.description ?? params.edge.description;

        const updated: Edge = {
            ...params.edge,
            type,
            description
        };

        return {
            success: true,
            edge: updated
        };
    }

    private validateAdd (params: GraphAddEdgeServiceParams): string | undefined {
        if (!isEdgeType(params.type)) {
            return 'Invalid edge type';
        }

        return undefined;
    }

    private validateUpdate (params: GraphUpdateEdgeServiceParams): string | undefined {
        if (params.type !== undefined && !isEdgeType(params.type)) {
            return 'Invalid edge type';
        }

        return undefined;
    }
}

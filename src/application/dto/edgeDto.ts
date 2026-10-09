import { isEdgeType } from '@domain/guards/edge-type.ts';
import type { EdgeDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Edge } from '@domain/entities/edge.ts';

export class EdgeDTO {
    static to_mongodb (edge: Edge): EdgeDocument {
        return {
            _id: edge.id,
            graph_id: edge.graphId,
            source_id: edge.sourceId,
            target_id: edge.targetId,
            type: edge.type,
            description: edge.description
        };
    }

    static to_domain (document: EdgeDocument): Edge {
        if (!isEdgeType(document.type)) {
            throw new Error(`Unknown edge type stored in database: ${document.type}`);
        }

        return {
            id: document._id,
            graphId: document.graph_id,
            sourceId: document.source_id,
            targetId: document.target_id,
            type: document.type,
            description: document.description
        };
    }
}

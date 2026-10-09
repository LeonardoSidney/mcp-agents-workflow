import { isNodeStatus } from '@domain/guards/node-status.ts';
import { isNodeType } from '@domain/guards/node-type.ts';
import type { NodeDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Node } from '@domain/entities/node.ts';

export class NodeDTO {
    static to_mongodb (node: Node): NodeDocument {
        return {
            _id: node.id,
            graph_id: node.graphId,
            type: node.type,
            status: node.status,
            title: node.title,
            description: node.description,
            created_at: node.createdAt,
            updated_at: node.updatedAt
        };
    }

    static to_domain (document: NodeDocument): Node {
        if (!isNodeType(document.type)) {
            throw new Error(`Unknown node type stored in database: ${document.type}`);
        }

        if (!isNodeStatus(document.status)) {
            throw new Error(`Unknown node status stored in database: ${document.status}`);
        }

        return {
            id: document._id,
            graphId: document.graph_id,
            type: document.type,
            status: document.status,
            title: document.title,
            description: document.description,
            createdAt: document.created_at,
            updatedAt: document.updated_at
        };
    }
}

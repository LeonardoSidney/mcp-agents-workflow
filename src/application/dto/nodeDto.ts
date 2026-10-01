import { isEdgeType } from '@domain/guards/edge-type.ts';
import { isNodeStatus } from '@domain/guards/node-status.ts';
import { isNodeType } from '@domain/guards/node-type.ts';
import type { NodeDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Node, NodeLink } from '@domain/entities/node.ts';

export class NodeDTO {
    static to_mongodb (node: Node): NodeDocument {
        return {
            id: node.id,
            graph_id: node.graphId,
            type: node.type,
            status: node.status,
            title: node.title,
            description: node.description,
            links: node.links,
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

        const links: NodeLink[] = document.links.map(link => {
            if (!isEdgeType(link.type)) {
                throw new Error(`Unknown edge type stored in database: ${link.type}`);
            }

            return { type: link.type, targetId: link.targetId };
        });

        return {
            id: document.id,
            graphId: document.graph_id,
            type: document.type,
            status: document.status,
            title: document.title,
            description: document.description,
            links,
            createdAt: document.created_at,
            updatedAt: document.updated_at
        };
    }
}

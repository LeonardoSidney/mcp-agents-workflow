import { isNodeStatus } from '@domain/guards/node-status.ts';
import { isNodeType } from '@domain/guards/node-type.ts';
import type { NodeDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Node } from '@domain/entities/node.ts';

export class NodeDTO {
    static to_mongodb (node: Node): NodeDocument {
        const document: NodeDocument = {
            _id: node.id,
            graph_id: node.graphId,
            type: node.type,
            status: node.status,
            title: node.title,
            description: node.description,
            paths: node.paths,
            created_at: node.createdAt,
            updated_at: node.updatedAt
        };

        if (node.commit) {
            document.commit = node.commit;
        }

        return document;
    }

    static to_domain (document: NodeDocument): Node {
        if (!isNodeType(document.type)) {
            throw new Error(`Unknown node type stored in database: ${document.type}`);
        }

        if (!isNodeStatus(document.status)) {
            throw new Error(`Unknown node status stored in database: ${document.status}`);
        }

        const node: Node = {
            id: document._id,
            graphId: document.graph_id,
            type: document.type,
            status: document.status,
            title: document.title,
            description: document.description,
            paths: document.paths ?? [],
            createdAt: document.created_at,
            updatedAt: document.updated_at
        };

        if (document.commit) {
            node.commit = document.commit;
        }

        return node;
    }
}

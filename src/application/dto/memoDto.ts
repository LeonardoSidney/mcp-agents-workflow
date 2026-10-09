import { isMemoAuthor } from '@domain/guards/memo-author.ts';
import type { MemoDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Memo } from '@domain/entities/memo.ts';

export class MemoDTO {
    static to_mongodb (memo: Memo): MemoDocument {
        return {
            _id: memo.id,
            node_id: memo.nodeId,
            author: memo.author,
            text: memo.text,
            created_at: memo.createdAt
        };
    }

    static to_domain (document: MemoDocument): Memo {
        if (!isMemoAuthor(document.author)) {
            throw new Error(`Unknown memo author stored in database: ${document.author}`);
        }

        return {
            id: document._id,
            nodeId: document.node_id,
            author: document.author,
            text: document.text,
            createdAt: document.created_at
        };
    }
}

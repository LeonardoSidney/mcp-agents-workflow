import { MEMO_TYPES } from '@domain/constants/memo-types.ts';
import { isMemoAuthor } from '@domain/guards/memo-author.ts';
import { isMemoType } from '@domain/guards/memo-type.ts';
import type { MemoDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Memo } from '@domain/entities/memo.ts';

export class MemoDTO {
    static to_mongodb (memo: Memo): MemoDocument {
        return {
            _id: memo.id,
            node_id: memo.nodeId,
            author: memo.author,
            type: memo.type,
            text: memo.text,
            created_at: memo.createdAt
        };
    }

    static to_domain (document: MemoDocument): Memo {
        if (!isMemoAuthor(document.author)) {
            throw new Error(`Unknown memo author stored in database: ${document.author}`);
        }

        if (document.type !== undefined && !isMemoType(document.type)) {
            throw new Error(`Unknown memo type stored in database: ${document.type}`);
        }

        return {
            id: document._id,
            nodeId: document.node_id,
            author: document.author,
            type: document.type ?? MEMO_TYPES.NOTE.value,
            text: document.text,
            createdAt: document.created_at
        };
    }
}

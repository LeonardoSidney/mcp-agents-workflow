import { randomBytes } from 'node:crypto';
import { isMemoAuthor } from '@domain/guards/memo-author.ts';
import type { Memo } from '@domain/entities/memo.ts';
import type { GraphAppendMemoServiceParams, GraphAppendMemoServiceResponse, IGraphAppendMemoService } from '@domain/services/iGraphAppendMemoService.ts';

export class GraphAppendMemoService implements IGraphAppendMemoService {
  mapMemo (params: GraphAppendMemoServiceParams): GraphAppendMemoServiceResponse {
    const validationError = this.validate(params);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    const memo: Memo = {
      id: randomBytes(12).toString('hex'),
      nodeId: params.nodeId,
      author: params.author,
      text: params.text,
      createdAt: new Date()
    };

    return {
      success: true,
      memo
    };
  }

  private validate (params: GraphAppendMemoServiceParams): string | undefined {
    if (!isMemoAuthor(params.author)) {
      return 'Invalid memo author';
    }

    return undefined;
  }
}

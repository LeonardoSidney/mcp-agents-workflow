import type { IMemoRepository, AddMemoRepositoryParams, DeleteMemosByNodeRepositoryParams, ListMemosByNodeRepositoryParams } from '@domain/repository/iMemoRepository.ts';
import type { Memo } from '@domain/entities/memo.ts';
import type { IDatabaseGateway } from '@domain/gateways/iDatabaseGateway.ts';
import { MemoDTO } from '@application/dto/memoDto.ts';

export class MemoRepository implements IMemoRepository {
  private readonly databaseGateway: IDatabaseGateway;

  constructor (
    databaseGateway: IDatabaseGateway
  ) {
    this.databaseGateway = databaseGateway;
  }

  async addMemo (params: AddMemoRepositoryParams): Promise<void> {
    const memoDocument = MemoDTO.to_mongodb(params.memo);

    await this.databaseGateway.addMemo({ memo: memoDocument });
  }

  async listMemosByNode (params: ListMemosByNodeRepositoryParams): Promise<Memo[]> {
    const documents = await this.databaseGateway.listMemosByNode({ nodeId: params.nodeId });

    return documents.map(document => MemoDTO.to_domain(document));
  }

  async deleteMemosByNode (params: DeleteMemosByNodeRepositoryParams): Promise<void> {
    await this.databaseGateway.deleteMemosByNode({ nodeId: params.nodeId });
  }
}

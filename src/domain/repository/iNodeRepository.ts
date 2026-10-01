import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { Node } from '@domain/entities/node.ts';

export interface INodeRepository {
    addNode (params: AddNodeRepositoryParams): Promise<void>;
    getNode (params: GetNodeRepositoryParams): Promise<Node | null>;
    getNodes (params: GetNodesRepositoryParams): Promise<Node[]>;
    updateNode (params: UpdateNodeRepositoryParams): Promise<boolean>;
    deleteNode (params: DeleteNodeRepositoryParams): Promise<boolean>;
    removeNodeLinks (params: RemoveNodeLinksRepositoryParams): Promise<void>;
}

export type AddNodeRepositoryParams = {
    node: Node;
};

export type GetNodeRepositoryParams = {
    id: string;
};

export type GetNodesRepositoryParams = {
    graphId: string;
    type?: NodeType;
    status?: NodeStatus;
    limit?: number;
};

export type UpdateNodeRepositoryParams = {
    node: Node;
};

export type DeleteNodeRepositoryParams = {
    id: string;
};

export type RemoveNodeLinksRepositoryParams = {
    graphId: string;
    targetId: string;
};

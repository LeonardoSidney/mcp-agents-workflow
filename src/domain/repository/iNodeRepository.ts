import type { Node } from '@domain/entities/node.ts';

export interface INodeRepository {
    addNode (params: AddNodeRepositoryParams): Promise<void>;
    getNode (params: GetNodeRepositoryParams): Promise<Node | null>;
    getNodes (params: GetNodesRepositoryParams): Promise<Node[]>;
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
};

export type DeleteNodeRepositoryParams = {
    id: string;
};

export type RemoveNodeLinksRepositoryParams = {
    graphId: string;
    targetId: string;
};

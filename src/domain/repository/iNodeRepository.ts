import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';
import type { Edge } from '@domain/entities/edge.ts';
import type { Node, NodeWithEdges } from '@domain/entities/node.ts';

export interface INodeRepository {
    addNode (params: AddNodeRepositoryParams): Promise<void>;
    getNode (params: GetNodeRepositoryParams): Promise<NodeWithEdges | null>;
    getNodes (params: GetNodesRepositoryParams): Promise<NodeWithEdges[]>;
    updateNode (params: UpdateNodeRepositoryParams): Promise<boolean>;
    deleteNode (params: DeleteNodeRepositoryParams): Promise<boolean>;
    listReferencingNodeIds (params: ListReferencingNodeIdsRepositoryParams): Promise<string[]>;
}

export type AddNodeRepositoryParams = {
    node: Node;
    edges: Edge[];
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
    edges?: Edge[];
};

export type DeleteNodeRepositoryParams = {
    id: string;
};

export type ListReferencingNodeIdsRepositoryParams = {
    graphId: string;
    targetId: string;
};

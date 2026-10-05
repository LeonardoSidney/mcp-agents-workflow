import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';

export interface IDatabaseGateway {
    addGraph (params: AddGraphGatewayParams): Promise<void>;
    listGraphs (): Promise<ProjectDocument[]>;
    listGraph (params: ListGraphGatewayParams): Promise<ProjectDocument | null>;
    deleteGraph (params: DeleteGraphGatewayParams): Promise<boolean>;
    addNode (params: AddNodeGatewayParams): Promise<void>;
    updateNode (params: UpdateNodeGatewayParams): Promise<boolean>;
    listNode (params: ListNodeGatewayParams): Promise<NodeDocument | null>;
    listNodes (params: ListNodesGatewayParams): Promise<NodeDocument[]>;
    deleteNode (params: DeleteNodeGatewayParams): Promise<boolean>;
    addEdge (params: AddEdgeGatewayParams): Promise<void>;
    updateEdge (params: UpdateEdgeGatewayParams): Promise<boolean>;
    listEdge (params: ListEdgeGatewayParams): Promise<EdgeDocument | null>;
    deleteEdge (params: DeleteEdgeGatewayParams): Promise<boolean>;
    listEdgesBySource (params: ListEdgesBySourceGatewayParams): Promise<EdgeDocument[]>;
    listEdgesByTarget (params: ListEdgesByTargetGatewayParams): Promise<EdgeDocument[]>;
}

export type AddGraphGatewayParams = {
    project: ProjectDocument;
};

export type ListGraphGatewayParams = {
    id: string;
};

export type DeleteGraphGatewayParams = {
    id: string;
};

export type AddNodeGatewayParams = {
    node: NodeDocument;
};

export type UpdateNodeGatewayParams = {
    node: NodeDocument;
};

export type ListNodeGatewayParams = {
    id: string;
};

export type ListNodesGatewayParams = {
    graphId: string;
    type?: NodeType;
    status?: NodeStatus;
    limit?: number;
};

export type DeleteNodeGatewayParams = {
    id: string;
};

export type ProjectDocument = {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: Date;
    updated_at: Date;
};

export type NodeDocument = {
    id: string;
    graph_id: string;
    type: string;
    status: string;
    title: string;
    description: string;
    created_at: Date;
    updated_at: Date;
};

export type EdgeDocument = {
    id: string;
    graph_id: string;
    source_id: string;
    target_id: string;
    type: string;
    description?: string;
};

export type ListEdgesBySourceGatewayParams = {
    graphId: string;
    sourceId: string;
};

export type ListEdgesByTargetGatewayParams = {
    graphId: string;
    targetId: string;
};

export type AddEdgeGatewayParams = {
    edge: EdgeDocument;
};

export type UpdateEdgeGatewayParams = {
    edge: EdgeDocument;
};

export type ListEdgeGatewayParams = {
    id: string;
};

export type DeleteEdgeGatewayParams = {
    graphId: string;
    id: string;
};



import type { NodeStatus } from '@domain/constants/node-status.ts';
import type { NodeType } from '@domain/constants/node-types.ts';

export interface IDatabaseGateway {
    addGraph (params: AddGraphGatewayParams): Promise<void>;
    listGraphs (): Promise<ProjectDocument[]>;
    listGraph (params: ListGraphGatewayParams): Promise<ProjectDocument | null>;
    deleteGraph (params: DeleteGraphGatewayParams): Promise<boolean>;
    addNodeWithEdges (params: AddNodeWithEdgesGatewayParams): Promise<void>;
    updateNodeWithEdges (params: UpdateNodeWithEdgesGatewayParams): Promise<boolean>;
    listNode (params: ListNodeGatewayParams): Promise<NodeDocument | null>;
    listNodes (params: ListNodesGatewayParams): Promise<NodeDocument[]>;
    deleteNodeWithEdges (params: DeleteNodeGatewayParams): Promise<boolean>;
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

export type AddNodeWithEdgesGatewayParams = {
    node: NodeDocument;
    edges: EdgeDocument[];
};

export type UpdateNodeWithEdgesGatewayParams = {
    node: NodeDocument;
    edges?: EdgeDocument[];
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



export interface IDatabaseGateway {
    addGraph (params: AddGraphGatewayParams): Promise<void>;
    listGraphs (): Promise<ProjectDocument[]>;
    listGraph (params: ListGraphGatewayParams): Promise<ProjectDocument | null>;
    deleteGraph (params: DeleteGraphGatewayParams): Promise<boolean>;
    addNode (params: AddNodeGatewayParams): Promise<void>;
    listNode (params: ListNodeGatewayParams): Promise<NodeDocument | null>;
    listNodes (params: ListNodesGatewayParams): Promise<NodeDocument[]>;
    deleteNode (params: DeleteNodeGatewayParams): Promise<boolean>;
    removeNodeLinks (params: RemoveNodeLinksGatewayParams): Promise<void>;
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

export type ListNodeGatewayParams = {
    id: string;
};

export type ListNodesGatewayParams = {
    graphId: string;
};

export type DeleteNodeGatewayParams = {
    id: string;
};

export type RemoveNodeLinksGatewayParams = {
    graphId: string;
    targetId: string;
};

export type ProjectDocument = {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: Date;
    updated_at: Date;
};

export type NodeDocumentLink = {
    type: string;
    targetId: string;
};

export type NodeDocument = {
    id: string;
    graph_id: string;
    type: string;
    status: string;
    title: string;
    description: string;
    links: NodeDocumentLink[];
    created_at: Date;
    updated_at: Date;
};

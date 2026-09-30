export interface IDatabaseGateway {
    addGraph (params: AddGraphGatewayParams): Promise<void>;
    listGraphs (): Promise<ProjectDocument[]>;
    listGraph (params: ListGraphGatewayParams): Promise<ProjectDocument | null>;
    deleteGraph (params: DeleteGraphGatewayParams): Promise<boolean>;
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

export type ProjectDocument = {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: Date;
    updated_at: Date;
};

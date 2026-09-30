export interface IDatabaseGateway {
    addGraph (params: AddGraphGatewayParams): Promise<void>;
}

export type AddGraphGatewayParams = {
    project: ProjectDocument;
};

export type ProjectDocument = {
    name: string;
    description: string;
    status: string;
    created_at: Date;
    updated_at: Date;
};

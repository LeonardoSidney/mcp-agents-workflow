export interface IGraphNodeAnchorService {
    normalizeAnchors (params: GraphNodeAnchorServiceParams): GraphNodeAnchorServiceResponse;
    normalizePath (path: string): GraphNodePathResponse;
    matchesPath (nodePaths: string[], path: string): boolean;
}

export const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/;

export type GraphNodeAnchorServiceParams = {
    paths?: string[];
    commit?: string;
};

export type GraphNodeAnchorServiceResponse = {
    success: boolean;
    paths?: string[];
    commit?: string;
    error?: string;
};

export type GraphNodePathResponse = {
    success: boolean;
    path?: string;
    error?: string;
};

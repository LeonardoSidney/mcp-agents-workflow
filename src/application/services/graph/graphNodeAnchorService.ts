import { COMMIT_SHA_PATTERN } from '@domain/services/iGraphNodeAnchorService.ts';
import type { GraphNodeAnchorServiceParams, GraphNodeAnchorServiceResponse, GraphNodePathResponse, IGraphNodeAnchorService } from '@domain/services/iGraphNodeAnchorService.ts';

export class GraphNodeAnchorService implements IGraphNodeAnchorService {
    normalizeAnchors (params: GraphNodeAnchorServiceParams): GraphNodeAnchorServiceResponse {
        const commit = params.commit?.trim().toLowerCase();
        if (commit !== undefined && !COMMIT_SHA_PATTERN.test(commit)) {
            return {
                success: false,
                error: `Invalid commit SHA: ${params.commit}. Expected 7 to 40 hex characters`
            };
        }

        if (params.paths === undefined) {
            return {
                success: true,
                commit
            };
        }

        const paths: string[] = [];

        for (const rawPath of params.paths) {
            const normalized = this.normalizePath(rawPath);
            if (!normalized.success || normalized.path === undefined) {
                return {
                    success: false,
                    error: normalized.error
                };
            }

            if (!paths.includes(normalized.path)) {
                paths.push(normalized.path);
            }
        }

        return {
            success: true,
            paths,
            commit
        };
    }

    normalizePath (path: string): GraphNodePathResponse {
        const trimmed = path.trim().replace(/\\/g, '/');

        if (trimmed.startsWith('/') || /^[a-zA-Z]:/.test(trimmed)) {
            return {
                success: false,
                error: `Path must be relative to the workspace root: ${path}`
            };
        }

        const segments = trimmed.split('/').filter(segment => segment.length > 0 && segment !== '.');

        if (segments.includes('..')) {
            return {
                success: false,
                error: `Path must not leave the workspace root: ${path}`
            };
        }

        if (segments.length === 0) {
            return {
                success: false,
                error: 'A non-empty path is required'
            };
        }

        return {
            success: true,
            path: segments.join('/')
        };
    }

    matchesPath (nodePaths: string[], path: string): boolean {
        return nodePaths.some(nodePath => this.isSameOrNested(nodePath, path) || this.isSameOrNested(path, nodePath));
    }

    private isSameOrNested (path: string, ancestor: string): boolean {
        return path === ancestor || path.startsWith(`${ancestor}/`);
    }
}

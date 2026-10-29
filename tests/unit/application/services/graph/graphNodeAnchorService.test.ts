import { GraphNodeAnchorService } from '@application/services/graph/graphNodeAnchorService.ts';

describe('GraphNodeAnchorService', () => {
    const service = new GraphNodeAnchorService();

    test('keeps paths undefined when none are given, so an update keeps the current ones', () => {
        const response = service.normalizeAnchors({});

        expect(response).toEqual({ success: true, commit: undefined });
    });

    test('normalizes leading dot segments, trailing slashes and backslashes', () => {
        const response = service.normalizeAnchors({ paths: ['./src/mcp/', 'src\\domain\\entities'] });

        expect(response.paths).toEqual(['src/mcp', 'src/domain/entities']);
    });

    test('dedupes paths that normalize to the same value', () => {
        const response = service.normalizeAnchors({ paths: ['src/mcp', './src/mcp/'] });

        expect(response.paths).toEqual(['src/mcp']);
    });

    test('accepts an empty list so an update can clear the paths', () => {
        const response = service.normalizeAnchors({ paths: [] });

        expect(response).toEqual({ success: true, paths: [], commit: undefined });
    });

    test('rejects an absolute unix path', () => {
        const response = service.normalizeAnchors({ paths: ['/home/user/repo/src'] });

        expect(response.success).toBe(false);
        expect(response.error).toContain('relative to the workspace root');
    });

    test('rejects an absolute windows path', () => {
        const response = service.normalizeAnchors({ paths: ['C:\\repo\\src'] });

        expect(response.success).toBe(false);
        expect(response.error).toContain('relative to the workspace root');
    });

    test('rejects a path that leaves the workspace root', () => {
        const response = service.normalizeAnchors({ paths: ['src/../../secrets'] });

        expect(response.success).toBe(false);
        expect(response.error).toContain('must not leave the workspace root');
    });

    test('rejects a path made only of separators and dots', () => {
        const response = service.normalizeAnchors({ paths: ['./'] });

        expect(response.success).toBe(false);
        expect(response.error).toEqual('A non-empty path is required');
    });

    test('lowercases and trims a valid commit SHA', () => {
        const response = service.normalizeAnchors({ commit: ' 7F750F2 ' });

        expect(response.commit).toEqual('7f750f2');
    });

    test('accepts a full 40-character commit SHA', () => {
        const sha = 'a'.repeat(40);

        const response = service.normalizeAnchors({ commit: sha });

        expect(response.commit).toEqual(sha);
    });

    test('rejects a commit SHA shorter than 7 characters', () => {
        const response = service.normalizeAnchors({ commit: '7f750f' });

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid commit SHA');
    });

    test('rejects a commit SHA with non-hex characters', () => {
        const response = service.normalizeAnchors({ commit: 'main' });

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid commit SHA');
    });

    test('matches a node path equal to the query path', () => {
        expect(service.matchesPath(['src/mcp/nodeTools.ts'], 'src/mcp/nodeTools.ts')).toBe(true);
    });

    test('matches a node file inside a directory query', () => {
        expect(service.matchesPath(['src/mcp/nodeTools.ts'], 'src/mcp')).toBe(true);
    });

    test('matches a directory node path containing the query file', () => {
        expect(service.matchesPath(['src/mcp'], 'src/mcp/nodeTools.ts')).toBe(true);
    });

    test('does not match a sibling that only shares a name prefix', () => {
        expect(service.matchesPath(['src/mcp-legacy/tools.ts'], 'src/mcp')).toBe(false);
    });

    test('does not match a node without paths', () => {
        expect(service.matchesPath([], 'src/mcp')).toBe(false);
    });
});

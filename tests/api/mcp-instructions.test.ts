import type { Tool } from '@modelcontextprotocol/client';
import { mcpTestHarness } from './mcpHarness.ts';

const { instructions, listTools } = mcpTestHarness();

describe('MCP server instructions', () => {
    test('advertises the graph as shared working memory to the client at initialize', () => {
        const text = instructions();

        for (const anchor of [
            'shared working memory',
            'Never assume that knowledge from a previous session is unavailable',
            'Mandatory bootstrap',
            'Register the current user request',
            'graph - get - project',
            'graph - search - nodes',
            'graph - get - node',
            'append a memo',
            'Memos are append-only',
            'TASK → SOLUTION',
            'in_progress',
            'Cross-task learning'
        ]) {
            expect(text).toContain(anchor);
        }
    });

    test('tells the agent to attribute memos to the speaker, not the one typing', async () => {
        const { tools } = await listTools();
        const appendMemo = tools.find(tool => tool.name === 'graph-append-memo');
        if (!appendMemo) {
            throw new Error('graph-append-memo is not registered');
        }

        const schema = (appendMemo as Tool).inputSchema as Record<string, unknown>;
        const properties = schema['properties'] as Record<string, { description?: string; } | undefined>;
        const authorDescription = properties['author']?.description;

        expect(authorDescription).toContain('not the one typing it');
    });
});

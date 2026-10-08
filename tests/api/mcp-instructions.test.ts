import type { Tool } from '@modelcontextprotocol/client';
import { mcpTestHarness } from './mcpHarness.ts';

const { instructions, listTools } = mcpTestHarness();

describe('MCP server instructions', () => {
    test('advertises the graph as shared working memory to the client at initialize', () => {
        const text = instructions();

        for (const anchor of [
            'shared working memory',
            'One project per workspace, named after the workspace',
            'Before starting any task',
            'graph-get-projects',
            'graph-search-nodes',
            'graph-get-node',
            'graph-append-memo',
            'SOLVED_BY',
            'in_progress',
            'CONSTRAINED_BY'
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

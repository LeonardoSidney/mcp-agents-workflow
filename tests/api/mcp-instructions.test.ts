import type { Tool } from '@modelcontextprotocol/client';
import { mcpTestHarness } from './mcpHarness.ts';

const { instructions, listTools } = mcpTestHarness();

describe('MCP server instructions', () => {
    test('advertises the graph as persistent memory shared across agents and sessions', () => {
        expect(instructions()).toContain('persistent memory shared by every agent and session');
    });

    test('lets the user instructions take precedence over the protocol', () => {
        expect(instructions()).toContain("The user's instructions and the current request always take precedence");
    });

    test('bootstraps the workspace project once per session by name', () => {
        const text = instructions();

        expect(text).toContain('once per session, not per turn');
        expect(text).toContain('graph-get-project with the workspace folder name');
        expect(text).toContain('graph-add');
    });

    test('limits recall to non-trivial work with short search queries', () => {
        const text = instructions();

        expect(text).toContain('Recall before non-trivial work');
        expect(text).toContain('graph-search-nodes');
        expect(text).toContain('Do not fall back to listing every node');
    });

    test('treats recalled knowledge as a lead behind the code and the user', () => {
        expect(instructions()).toContain('Recalled knowledge is a lead, not the truth');
    });

    test('writes back only what the repository cannot hold', () => {
        const text = instructions();

        expect(text).toContain('Write back what the repository cannot hold');
        expect(text).toContain('Do not record what the code or the git history already holds');
    });

    test('scales the writing to the size of the work', () => {
        expect(instructions()).toContain('Scale the writing to the work');
    });

    test('requires every graph string to be in English', () => {
        expect(instructions()).toContain('Write everything in English');
    });

    test('teaches the memo types and their promotion', () => {
        const text = instructions();

        expect(text).toContain('"note"');
        expect(text).toContain('"resolution"');
        expect(text).toContain('"directive"');
        expect(text).toContain('graph-edit-memo');
    });

    test('links outdated knowledge to its replacement with SUPERSEDES', () => {
        expect(instructions()).toContain('SUPERSEDES');
    });

    test('never lets a graph failure block the user task', () => {
        const text = instructions();

        expect(text).toContain("carry on with the\nuser's task without the graph");
        expect(text).toContain('Never claim a write succeeded without a successful tool result');
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

        const required = schema['required'] as string[] | undefined;
        expect(required).toContain('type');

        const typeDescription = properties['type']?.description;
        expect(typeDescription).toContain('resolution');
        expect(typeDescription).toContain('directive');
    });
});

import type { NodeWithMemos } from '@domain/entities/node.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addMemo, addNode, addProject, callTool, editMemo, fetchNode, memosCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-edit-memo', () => {
    test('reclassifies the type of a memo and persists it without touching text or author', async () => {
        const graph = await addProject('Memo Edit Project', 'Project used to reclassify memo types');
        const node = await addNode(graph.id, 'TASK', 'Memo edit task', 'Task used to reclassify a memo type');
        const memo = await addMemo(node.id, 'agent', 'note', 'An answer that outgrew its note type');

        const result = await editMemo(memo.id, 'resolution');

        expect(result.isError).toBeFalsy();
        expect(textOf(result)).toMatch(/^Memo updated successfully: [0-9a-f]{24}$/);

        const saved = await memosCollection.find({}).toArray();
        expect(saved[0]).toMatchObject({ type: 'resolution', author: 'agent', text: 'An answer that outgrew its note type' });

        const stored = JSON.parse(textOf(await fetchNode(node.id))) as NodeWithMemos;
        expect(stored.memos).toHaveLength(1);
        expect(stored.memos[0]).toMatchObject({ id: memo.id, type: 'resolution', author: 'agent', text: 'An answer that outgrew its note type' });
    });

    test('refuses to reclassify the type of a memo that does not exist', async () => {
        const missingMemoId = '0'.repeat(24);

        const result = await editMemo(missingMemoId, 'directive');

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Memo not found');
    });

    test('refuses to reclassify a memo to an unknown type', async () => {
        const graph = await addProject('Memo Edit Type Project', 'Project used to reject an invalid memo type');
        const node = await addNode(graph.id, 'TASK', 'Memo editing task', 'Task used to reject an invalid memo type');
        const memo = await addMemo(node.id, 'agent', 'note', 'A memo that must not be reclassified');

        const result = await callTool('graph-edit-memo', { id: memo.id, type: 'resolutionary' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Invalid arguments');

        const saved = await memosCollection.find({}).toArray();
        expect(saved[0]).toMatchObject({ type: 'note' });
    });
});

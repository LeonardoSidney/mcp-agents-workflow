import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, callTool, fetchProject, projectsCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-delete-project', () => {
    test('deletes one project by id', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle');
        await addProject('Second Project', 'Second project of the lifecycle');

        const deleteResult = await callTool('graph-delete-project', { id: first.id });

        expect(deleteResult.isError).toBeFalsy();
        expect(textOf(deleteResult)).toContain('Project deleted successfully');

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(2);

        const deleted = saved.find(document => document.name === 'First Project');
        if (!deleted) {
            throw new Error('Expected the deleted project document to remain in the database');
        }
        expect(deleted.deleted_at).toBeInstanceOf(Date);

        const survivor = saved.find(document => document.name === 'Second Project');
        if (!survivor) {
            throw new Error('Expected the surviving project document to remain in the database');
        }
        expect(survivor.deleted_at).toBeUndefined();

        const fetchResult = await fetchProject(first.id);
        expect(fetchResult.isError).toBe(true);
        expect(textOf(fetchResult)).toContain('Project not found');
    });

    test('frees the project name for reuse after deletion', async () => {
        const first = await addProject('Freed Project', 'Project whose name will be reused');

        const deleteResult = await callTool('graph-delete-project', { id: first.id });
        expect(deleteResult.isError).toBeFalsy();

        const reborn = await addProject('Freed Project', 'Reborn project reusing the freed name');
        expect(reborn.id).not.toEqual(first.id);
    });
});

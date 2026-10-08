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
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({ name: 'Second Project' });

        const fetchResult = await fetchProject(first.id);
        expect(fetchResult.isError).toBe(true);
        expect(textOf(fetchResult)).toContain('Project not found');
    });
});

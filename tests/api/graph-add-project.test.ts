import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, callTool, projectsCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-add-project', () => {
    test('creates two projects', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle');
        const second = await addProject('Second Project', 'Second project of the lifecycle');

        expect(first.id).not.toEqual(second.id);

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(2);
        expect(saved.map(document => document.name)).toEqual(
            expect.arrayContaining(['First Project', 'Second Project'])
        );
    });

    test('refuses to create a project with an existing name', async () => {
        await addProject('First Project', 'First project of the lifecycle');

        const result = await callTool('graph-add', { name: 'First Project', description: 'A duplicate name' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('already exists');

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(1);
    });
});

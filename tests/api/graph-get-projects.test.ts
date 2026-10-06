import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, callTool, projectsCollection, textOf } = mcpTestHarness();

describe('MCP server - graph-get-projects', () => {
    test('lists all the inserted projects', async () => {
        await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

        const result = await callTool('graph-get-projects');

        expect(result.isError).toBeFalsy();
        expect(textOf(result)).toContain('First Project');
        expect(textOf(result)).toContain('Second Project');

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(2);
    });
});

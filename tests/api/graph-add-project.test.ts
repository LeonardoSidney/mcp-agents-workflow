import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, projectsCollection } = mcpTestHarness();

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
});

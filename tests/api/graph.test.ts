import type { Project } from '@domain/entities/project.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, callTool, fetchProject, projectsCollection, textOf } = mcpTestHarness();

describe('MCP server - project lifecycle', () => {
    test('creates two projects', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        const second = await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

        expect(first.id).not.toEqual(second.id);

        const saved = await projectsCollection.find({}).toArray();
        expect(saved).toHaveLength(2);
        expect(saved.map(document => document.name)).toEqual(
            expect.arrayContaining(['First Project', 'Second Project'])
        );
    });

    test('lists both inserted projects by the returned uuidv4', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        const second = await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

        const firstResult = await fetchProject(first.id);
        const secondResult = await fetchProject(second.id);

        expect(firstResult.isError).toBeFalsy();
        expect(secondResult.isError).toBeFalsy();

        const firstProject = JSON.parse(textOf(firstResult)) as Project;
        const secondProject = JSON.parse(textOf(secondResult)) as Project;

        expect(firstProject).toMatchObject({ id: first.id, name: 'First Project' });
        expect(secondProject).toMatchObject({ id: second.id, name: 'Second Project' });
    });

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

    test('deletes one project by id', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle', 'waiting_goal');
        await addProject('Second Project', 'Second project of the lifecycle', 'in_progress');

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

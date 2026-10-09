import type { Project } from '@domain/entities/project.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, callTool, fetchProject, textOf } = mcpTestHarness();

describe('MCP server - graph-get-project', () => {
    it('fetches a project by the returned id', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle');
        const second = await addProject('Second Project', 'Second project of the lifecycle');

        const firstResult = await fetchProject(first.id);
        const secondResult = await fetchProject(second.id);

        expect(firstResult.isError).toBeFalsy();
        expect(secondResult.isError).toBeFalsy();

        const firstProject = JSON.parse(textOf(firstResult)) as Project;
        const secondProject = JSON.parse(textOf(secondResult)) as Project;

        expect(firstProject).toMatchObject({ id: first.id, name: 'First Project' });
        expect(secondProject).toMatchObject({ id: second.id, name: 'Second Project' });
    });

    it('fetches a project by its exact name', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle');
        await addProject('Second Project', 'Second project of the lifecycle');

        const result = await callTool('graph-get-project', { name: 'First Project' });

        expect(result.isError).toBeFalsy();

        const project = JSON.parse(textOf(result)) as Project;
        expect(project).toMatchObject({ id: first.id, name: 'First Project' });
    });

    it('refuses to fetch a project with an unknown name', async () => {
        await addProject('First Project', 'First project of the lifecycle');

        const result = await callTool('graph-get-project', { name: 'Missing Project' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Project not found');
    });

    it('refuses to fetch a project with neither id nor name', async () => {
        const result = await callTool('graph-get-project', {});

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('Provide either a project id or a project name');
    });

    it('refuses to fetch a project with both id and name', async () => {
        const first = await addProject('First Project', 'First project of the lifecycle');

        const result = await callTool('graph-get-project', { id: first.id, name: 'First Project' });

        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('not both');
    });
});

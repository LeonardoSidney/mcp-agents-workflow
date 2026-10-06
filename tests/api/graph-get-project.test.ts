import type { Project } from '@domain/entities/project.ts';
import { mcpTestHarness } from './mcpHarness.ts';

const { addProject, fetchProject, textOf } = mcpTestHarness();

describe('MCP server - graph-get-project', () => {
    test('fetches a project by the returned uuidv4', async () => {
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
});

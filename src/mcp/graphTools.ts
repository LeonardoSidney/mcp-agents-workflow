import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { GraphAddControllerResponse } from '@domain/controllers/iGraphAddController.ts';
import type { GraphDeleteProjectControllerResponse } from '@domain/controllers/iGraphDeleteProjectController.ts';
import { graphAddController, graphDeleteProjectController, graphGetProjectController, graphGetProjectsController } from '@src/container.ts';

function controllerResponseToText (response: GraphAddControllerResponse): string {
    if (response.success && response.project) {
        const { project } = response;
        return `Project created successfully.\n${JSON.stringify(project, null, 4)}`;
    }

    return `Failed to create project: ${response.error ?? 'Unknown error'}`;
}

export function registerGraphTools (server: McpServer): void {
    server.registerTool(
        'graph-add',
        {
            description: 'Add a new project to the agent workflow graph. Convention: one project per workspace, named after the workspace - create the workspace project here if it does not exist yet',
            inputSchema: z.object({
                name: z.string().min(1).describe('Project name'),
                description: z.string().min(1).describe('Project description')
            })
        },
        async ({ name, description }) => {
            const controller = await graphAddController();
            const response = await controller.handle({ name, description });

            return {
                content: [{ type: 'text' as const, text: controllerResponseToText(response) }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-get-projects',
        {
            description: 'List all projects in the agent workflow graph. First call of any session: use it to locate the project named after the current workspace (your working context); if none exists, create it with graph-add'
        },
        async () => {
            const controller = await graphGetProjectsController();
            const response = await controller.handle();

            const text = response.success
                ? `Projects:\n${JSON.stringify(response.projects ?? [], null, 4)}`
                : `Failed to list projects: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-get-project',
        {
            description: 'Fetch a single project from the agent workflow graph by id (uuidv4)',
            inputSchema: z.object({
                id: z.uuid().describe('Project id (uuidv4)')
            })
        },
        async ({ id }): Promise<{ content: { type: 'text'; text: string; }[]; isError: boolean; }> => {
            const controller = await graphGetProjectController();
            const response = await controller.handle({ id });

            const text = response.success && response.project
                ? JSON.stringify(response.project, null, 4)
                : `Failed to fetch project: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-delete-project',
        {
            description: 'Delete a project from the agent workflow graph by id (uuidv4)',
            inputSchema: z.object({
                id: z.string().min(1).describe('Project id to delete')
            })
        },
        async ({ id }): Promise<{ content: { type: 'text'; text: string; }[]; isError: boolean; }> => {
            const controller = await graphDeleteProjectController();
            const response: GraphDeleteProjectControllerResponse = await controller.handle({ id });

            const text = response.success
                ? `Project deleted successfully: ${id}`
                : `Failed to delete project: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );
}

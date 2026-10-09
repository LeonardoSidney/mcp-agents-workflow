import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { GraphAddControllerResponse } from '@domain/controllers/iGraphAddController.ts';
import type { GraphDeleteProjectControllerResponse } from '@domain/controllers/iGraphDeleteProjectController.ts';
import { graphAddController, graphDeleteProjectController, graphGetProjectController, graphGetProjectsController } from '@src/container.ts';
import { objectId } from './objectIdSchema.ts';

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
            description: 'Add a new project to the agent workflow graph. Convention: one project per workspace, named after the workspace - create the workspace project here if it does not exist yet. Project names are unique across the store',
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
            description: 'List all projects in the agent workflow graph. Bootstrap lookup goes through graph-get-project by name; use this listing only to check whether the workspace project exists under a name different from the workspace folder name'
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
            description: 'Fetch a single project from the agent workflow graph by id (24-hex ObjectId) or by exact name; provide exactly one of the two',
            inputSchema: z.object({
                id: objectId.optional().describe('Project id (24-hex ObjectId)'),
                name: z.string().min(1).optional().describe('Project name for an exact match. For session bootstrap, pass the workspace folder name: a miss means the project does not exist yet and should be created with graph-add')
            })
        },
        async ({ id, name }): Promise<{ content: { type: 'text'; text: string; }[]; isError: boolean; }> => {
            const controller = await graphGetProjectController();
            const response = await controller.handle({ id, name });

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
            description: 'Delete a project from the agent workflow graph by id (24-hex ObjectId)',
            inputSchema: z.object({
                id: objectId.describe('Project id to delete (24-hex ObjectId)')
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

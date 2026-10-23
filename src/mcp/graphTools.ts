import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { GraphAddControllerResponse } from '@domain/controllers/iGraphAddController.ts';
import type { GraphDeleteProjectControllerResponse } from '@domain/controllers/iGraphDeleteProjectController.ts';
import { graphAddController, graphDeleteProjectController, graphGetProjectController, graphGetProjectsController } from '@src/container.ts';
import { objectId } from './objectIdSchema.ts';
import {
    GRAPH_ADD_DESCRIPTION,
    GRAPH_ADD_DESCRIPTION_FIELD,
    GRAPH_ADD_NAME_FIELD,
    GRAPH_DELETE_PROJECT_DESCRIPTION,
    GRAPH_DELETE_PROJECT_ID_FIELD,
    GRAPH_GET_PROJECT_DESCRIPTION,
    GRAPH_GET_PROJECT_ID_FIELD,
    GRAPH_GET_PROJECT_NAME_FIELD,
    GRAPH_GET_PROJECTS_DESCRIPTION
} from './serverInstructions.ts';

function controllerResponseToText (response: GraphAddControllerResponse): string {
    if (response.success && response.project) {
        return `Project created successfully: ${response.project.id}`;
    }

    return `Failed to create project: ${response.error ?? 'Unknown error'}`;
}

export function registerGraphTools (server: McpServer): void {
    server.registerTool(
        'graph-add',
        {
            description: GRAPH_ADD_DESCRIPTION,
            inputSchema: z.object({
                name: z.string().min(1).describe(GRAPH_ADD_NAME_FIELD),
                description: z.string().min(1).describe(GRAPH_ADD_DESCRIPTION_FIELD)
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
            description: GRAPH_GET_PROJECTS_DESCRIPTION
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
            description: GRAPH_GET_PROJECT_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.optional().describe(GRAPH_GET_PROJECT_ID_FIELD),
                name: z.string().min(1).optional().describe(GRAPH_GET_PROJECT_NAME_FIELD)
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
            description: GRAPH_DELETE_PROJECT_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_DELETE_PROJECT_ID_FIELD)
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

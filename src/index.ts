import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import type { GraphAddControllerResponse } from '@domain/controllers/iGraphAddController.ts';
import type { GraphDeleteProjectControllerResponse } from '@domain/controllers/iGraphDeleteProjectController.ts';
import { graphAddController, graphDeleteProjectController, graphGetProjectController, graphGetProjectsController } from './container.ts';

const STATUS_VALUES = ['waiting_goal', 'in_progress', 'in_validation', 'completed'] as const;

function controllerResponseToText (response: GraphAddControllerResponse): string {
    if (response.success && response.project) {
        const { project } = response;
        return `Project created successfully.\n${JSON.stringify(project, null, 4)}`;
    }

    return `Failed to create project: ${response.error ?? 'Unknown error'}`;
}

export function createServer (): McpServer {
    const server = new McpServer({ name: 'mcp-agents-workflow', version: '1.0.0' });

    server.registerTool(
        'graph-add',
        {
            description: 'Add a new project to the agent workflow graph',
            inputSchema: z.object({
                name: z.string().min(1).describe('Project name'),
                description: z.string().min(1).describe('Project description'),
                status: z.enum(STATUS_VALUES).describe('Initial project status').default('waiting_goal')
            })
        },
        async ({ name, description, status }) => {
            const controller = await graphAddController();
            const response = await controller.handle({ name, description, status });

            return {
                content: [{ type: 'text' as const, text: controllerResponseToText(response) }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-get-projects',
        {
            description: 'List all projects in the agent workflow graph'
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
                id: z.string().uuid().describe('Project id (uuidv4)')
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

    return server;
}

if (process.env['NODE_ENV'] !== 'test') {
    serveStdio(createServer);
}

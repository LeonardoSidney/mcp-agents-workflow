import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { EDGE_TYPES } from '@domain/constants/edge-types.ts';
import { NODE_STATUS } from '@domain/constants/node-status.ts';
import { NODE_TYPES } from '@domain/constants/node-types.ts';
import { graphAddNodeController, graphDeleteNodeController, graphGetNodeController, graphGetNodesController, graphUpdateNodeController } from '@src/container.ts';

const NODE_TYPE_VALUES = Object.values(NODE_TYPES).map(nodeType => nodeType.value);
const EDGE_TYPE_VALUES = Object.values(EDGE_TYPES).map(edgeType => edgeType.value);
const NODE_STATUS_VALUES = Object.values(NODE_STATUS).map(nodeStatus => nodeStatus.value);

export function registerNodeTools (server: McpServer): void {
    server.registerTool(
        'graph-add-node',
        {
            description: 'Add a new node to an existing graph, optionally linked to other nodes of the same graph',
            inputSchema: z.object({
                graphId: z.string().uuid().describe('Graph (project) id this node belongs to (uuidv4)'),
                type: z.enum(NODE_TYPE_VALUES).describe('Node type'),
                title: z.string().min(1).describe('Node title'),
                description: z.string().min(1).describe('Node description'),
                status: z.enum(NODE_STATUS_VALUES).describe('Initial node status').default('pending'),
                links: z.array(z.object({
                    type: z.enum(EDGE_TYPE_VALUES).describe('Edge type to the target node'),
                    targetId: z.string().min(1).describe('Id of the node this link points to')
                })).default([]).describe('Links from this node to other nodes of the same graph')
            })
        },
        async ({ graphId, type, title, description, status, links }) => {
            const controller = await graphAddNodeController();
            const response = await controller.handle({ graphId, type, title, description, status, links });

            const text = response.success && response.node
                ? `Node created successfully.\n${JSON.stringify(response.node, null, 4)}`
                : `Failed to add node: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-get-nodes',
        {
            description: 'List all nodes of a graph (project)',
            inputSchema: z.object({
                graphId: z.string().uuid().describe('Graph (project) id whose nodes should be listed (uuidv4)')
            })
        },
        async ({ graphId }) => {
            const controller = await graphGetNodesController();
            const response = await controller.handle({ graphId });

            const text = response.success
                ? `Nodes:\n${JSON.stringify(response.nodes ?? [], null, 4)}`
                : `Failed to list nodes: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-get-node',
        {
            description: 'Fetch a single node from the agent workflow graph by id (uuidv4)',
            inputSchema: z.object({
                id: z.string().uuid().describe('Node id (uuidv4)')
            })
        },
        async ({ id }): Promise<{ content: { type: 'text'; text: string; }[]; isError: boolean; }> => {
            const controller = await graphGetNodeController();
            const response = await controller.handle({ id });

            const text = response.success && response.node
                ? JSON.stringify(response.node, null, 4)
                : `Failed to fetch node: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-update-node',
        {
            description: 'Update an existing node by id (uuidv4). Provide only the fields to change; omitted fields keep their current value. Pass links to replace the whole link list (an empty list clears all links). Node type cannot be changed.',
            inputSchema: z.object({
                id: z.string().uuid().describe('Node id to update (uuidv4)'),
                title: z.string().min(1).optional().describe('New node title (omit to keep current)'),
                description: z.string().min(1).optional().describe('New node description (omit to keep current)'),
                status: z.enum(NODE_STATUS_VALUES).optional().describe('New node status (omit to keep current)'),
                links: z.array(z.object({
                    type: z.enum(EDGE_TYPE_VALUES).describe('Edge type to the target node'),
                    targetId: z.string().min(1).describe('Id of the node this link points to')
                })).optional().describe('New links list, replacing the current one (omit to keep current)')
            })
        },
        async ({ id, title, description, status, links }) => {
            const controller = await graphUpdateNodeController();
            const response = await controller.handle({ id, title, description, status, links });

            const text = response.success && response.node
                ? `Node updated successfully.\n${JSON.stringify(response.node, null, 4)}`
                : `Failed to update node: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-delete-node',
        {
            description: 'Delete a node from the agent workflow graph by id (uuidv4) and remove links pointing to it',
            inputSchema: z.object({
                id: z.string().min(1).describe('Node id to delete')
            })
        },
        async ({ id }): Promise<{ content: { type: 'text'; text: string; }[]; isError: boolean; }> => {
            const controller = await graphDeleteNodeController();
            const response = await controller.handle({ id });

            const text = response.success
                ? `Node deleted successfully: ${id}`
                : `Failed to delete node: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );
}

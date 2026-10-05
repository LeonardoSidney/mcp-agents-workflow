import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { EDGE_TYPES } from '@domain/constants/edge-types.ts';
import { NODE_STATUS } from '@domain/constants/node-status.ts';
import { NODE_TYPES } from '@domain/constants/node-types.ts';
import { graphAddNodeController, graphDeleteNodeController, graphGetNodeController, graphGetNodesController, graphSearchNodesController, graphUpdateNodeController } from '@src/container.ts';

const NODE_TYPE_VALUES = Object.values(NODE_TYPES).map(nodeType => nodeType.value);
const EDGE_TYPE_VALUES = Object.values(EDGE_TYPES).map(edgeType => edgeType.value);
const NODE_STATUS_VALUES = Object.values(NODE_STATUS).map(nodeStatus => nodeStatus.value);

export function registerNodeTools (server: McpServer): void {
    server.registerTool(
        'graph-add-node',
        {
            description: 'Add a new node to an existing graph, optionally linked to other nodes of the same graph',
            inputSchema: z.object({
                graphId: z.uuid().describe('Graph (project) id this node belongs to (uuidv4)'),
                type: z.enum(NODE_TYPE_VALUES).describe('Node type'),
                title: z.string().min(1).describe('Node title'),
                description: z.string().min(1).describe('Node description'),
                status: z.enum(NODE_STATUS_VALUES).describe('Initial node status').default('pending'),
                edges: z.array(z.object({
                    type: z.enum(EDGE_TYPE_VALUES).describe('Edge type to the target node'),
                    targetId: z.string().min(1).describe('Id of the node this edge points to'),
                    description: z.string().min(1).optional().describe('Memory recorded on this edge: how the target was resolved or the rule that applies')
                })).default([]).describe('Edges from this node to other nodes of the same graph')
            })
        },
        async ({ graphId, type, title, description, status, edges }) => {
            const controller = await graphAddNodeController();
            const response = await controller.handle({ graphId, type, title, description, status, edges });

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
            description: 'List the nodes of a graph (project), ordered by the most recently updated first, optionally filtered by type and status and capped by a limit',
            inputSchema: z.object({
                graphId: z.uuid().describe('Graph (project) id whose nodes should be listed (uuidv4)'),
                type: z.enum(NODE_TYPE_VALUES).optional().describe('Only return nodes of this type (omit for all types)'),
                status: z.enum(NODE_STATUS_VALUES).optional().describe('Only return nodes with this status (omit for all statuses)'),
                limit: z.number().int().positive().optional().describe('Maximum number of nodes to return (omit for no limit)')
            })
        },
        async ({ graphId, type, status, limit }) => {
            const controller = await graphGetNodesController();
            const response = await controller.handle({ graphId, type, status, limit });

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
                id: z.uuid().describe('Node id (uuidv4)')
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
        'graph-search-nodes',
        {
            description: 'Search the nodes of a graph (project) by text across title and description, ranked by similarity. Use short meaningful tokens without articles or connectives from any language (e.g. "calculo vale refeicao", not "calculo do vale refeicao"); connectives match almost everything, so keep the query short or cap results with a limit.',
            inputSchema: z.object({
                graphId: z.uuid().describe('Graph (project) id whose nodes should be searched (uuidv4)'),
                text: z.string().min(1).describe('Text to match across title and description, as short meaningful tokens'),
                limit: z.number().int().positive().optional().describe('Maximum number of results to return (omit for no limit)')
            })
        },
        async ({ graphId, text, limit }) => {
            const controller = await graphSearchNodesController();
            const response = await controller.handle({ graphId, text, limit });

            const output = response.success
                ? `Results:\n${JSON.stringify(response.results ?? [], null, 4)}`
                : `Failed to search nodes: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text: output }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-update-node',
        {
            description: 'Update an existing node by id (uuidv4). Provide only the fields to change; omitted fields keep their current value. Pass edges to replace the whole edge list (an empty list clears all edges). Node type cannot be changed.',
            inputSchema: z.object({
                id: z.uuid().describe('Node id to update (uuidv4)'),
                title: z.string().min(1).optional().describe('New node title (omit to keep current)'),
                description: z.string().min(1).optional().describe('New node description (omit to keep current)'),
                status: z.enum(NODE_STATUS_VALUES).optional().describe('New node status (omit to keep current)'),
                edges: z.array(z.object({
                    type: z.enum(EDGE_TYPE_VALUES).describe('Edge type to the target node'),
                    targetId: z.string().min(1).describe('Id of the node this edge points to'),
                    description: z.string().min(1).optional().describe('Memory recorded on this edge: how the target was resolved or the rule that applies')
                })).optional().describe('New edges list, replacing the current one (omit to keep current)')
            })
        },
        async ({ id, title, description, status, edges }) => {
            const controller = await graphUpdateNodeController();
            const response = await controller.handle({ id, title, description, status, edges });

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
            description: 'Delete a node from the agent workflow graph by id (uuidv4). The node and its outgoing edges are removed atomically. Refuses deletion while other nodes keep edges to this node, so the recorded graph memory is not lost',
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

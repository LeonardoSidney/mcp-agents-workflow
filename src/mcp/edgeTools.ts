import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { EDGE_TYPES } from '@domain/constants/edge-types.ts';
import { graphAddEdgeController, graphDeleteEdgeController, graphUpdateEdgeController } from '@src/container.ts';
import { objectId } from './objectIdSchema.ts';

const EDGE_TYPE_VALUES = Object.values(EDGE_TYPES).map(edgeType => edgeType.value);

export function registerEdgeTools (server: McpServer): void {
    server.registerTool(
        'graph-add-edge',
        {
            description: 'Add a first-class edge to an existing graph, from one node to another of the same graph. Edges are independent of their nodes: creating one never mutates either node. Use the description to record the memory this edge carries: how the target was resolved or the rule that applies',
            inputSchema: z.object({
                graphId: objectId.describe('Graph (project) id this edge belongs to (24-hex ObjectId)'),
                sourceId: z.string().min(1).describe('Id of the node this edge starts from'),
                targetId: z.string().min(1).describe('Id of the node this edge points to'),
                type: z.enum(EDGE_TYPE_VALUES).describe('Edge type'),
                description: z.string().min(1).optional().describe('Memory recorded on this edge: how the target was resolved or the rule that applies')
            })
        },
        async ({ graphId, sourceId, targetId, type, description }) => {
            const controller = await graphAddEdgeController();
            const response = await controller.handle({ graphId, sourceId, targetId, type, description });

            const text = response.success && response.edge
                ? `Edge created successfully.\n${JSON.stringify(response.edge, null, 4)}`
                : `Failed to add edge: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-update-edge',
        {
            description: 'Update an existing edge by id. Provide only the fields to change; omitted fields keep their current value. Node fields are never touched by this tool.',
            inputSchema: z.object({
                id: objectId.describe('Edge id to update (24-hex ObjectId)'),
                type: z.enum(EDGE_TYPE_VALUES).optional().describe('New edge type (omit to keep current)'),
                description: z.string().min(1).optional().describe('New memory recorded on this edge (omit to keep current)')
            })
        },
        async ({ id, type, description }) => {
            const controller = await graphUpdateEdgeController();
            const response = await controller.handle({ id, type, description });

            const text = response.success && response.edge
                ? `Edge updated successfully.\n${JSON.stringify(response.edge, null, 4)}`
                : `Failed to update edge: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-delete-edge',
        {
            description: 'Delete an edge by id. Deleting an edge never touches its nodes; a node can only be deleted once it has no edges attached to it',
            inputSchema: z.object({
                id: objectId.describe('Edge id to delete (24-hex ObjectId)')
            })
        },
        async ({ id }): Promise<{ content: { type: 'text'; text: string; }[]; isError: boolean; }> => {
            const controller = await graphDeleteEdgeController();
            const response = await controller.handle({ id });

            const text = response.success
                ? `Edge deleted successfully: ${id}`
                : `Failed to delete edge: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );
}

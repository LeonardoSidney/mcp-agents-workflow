import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { EDGE_TYPES } from '@domain/constants/edge-types.ts';
import { graphAddEdgeController, graphDeleteEdgeController, graphUpdateEdgeController } from '@src/container.ts';
import { objectId } from './objectIdSchema.ts';
import {
    GRAPH_ADD_EDGE_DESCRIPTION,
    GRAPH_ADD_EDGE_DESCRIPTION_FIELD,
    GRAPH_ADD_EDGE_GRAPH_ID_FIELD,
    GRAPH_ADD_EDGE_SOURCE_ID_FIELD,
    GRAPH_ADD_EDGE_TARGET_ID_FIELD,
    GRAPH_ADD_EDGE_TYPE_FIELD,
    GRAPH_DELETE_EDGE_DESCRIPTION,
    GRAPH_DELETE_EDGE_ID_FIELD,
    GRAPH_UPDATE_EDGE_DESCRIPTION,
    GRAPH_UPDATE_EDGE_DESCRIPTION_FIELD,
    GRAPH_UPDATE_EDGE_ID_FIELD,
    GRAPH_UPDATE_EDGE_TYPE_FIELD
} from './serverInstructions.ts';

const EDGE_TYPE_VALUES = Object.values(EDGE_TYPES).map(edgeType => edgeType.value);

export function registerEdgeTools (server: McpServer): void {
    server.registerTool(
        'graph-add-edge',
        {
            description: GRAPH_ADD_EDGE_DESCRIPTION,
            inputSchema: z.object({
                graphId: objectId.describe(GRAPH_ADD_EDGE_GRAPH_ID_FIELD),
                sourceId: z.string().min(1).describe(GRAPH_ADD_EDGE_SOURCE_ID_FIELD),
                targetId: z.string().min(1).describe(GRAPH_ADD_EDGE_TARGET_ID_FIELD),
                type: z.enum(EDGE_TYPE_VALUES).describe(GRAPH_ADD_EDGE_TYPE_FIELD),
                description: z.string().min(1).optional().describe(GRAPH_ADD_EDGE_DESCRIPTION_FIELD)
            })
        },
        async ({ graphId, sourceId, targetId, type, description }) => {
            const controller = await graphAddEdgeController();
            const response = await controller.handle({ graphId, sourceId, targetId, type, description });

            const text = response.success && response.edge
                ? `Edge created successfully: ${response.edge.id}`
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
            description: GRAPH_UPDATE_EDGE_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_UPDATE_EDGE_ID_FIELD),
                type: z.enum(EDGE_TYPE_VALUES).optional().describe(GRAPH_UPDATE_EDGE_TYPE_FIELD),
                description: z.string().min(1).optional().describe(GRAPH_UPDATE_EDGE_DESCRIPTION_FIELD)
            })
        },
        async ({ id, type, description }) => {
            const controller = await graphUpdateEdgeController();
            const response = await controller.handle({ id, type, description });

            const text = response.success && response.edge
                ? `Edge updated successfully: ${response.edge.id}`
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
            description: GRAPH_DELETE_EDGE_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_DELETE_EDGE_ID_FIELD)
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

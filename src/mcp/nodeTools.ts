import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { MEMO_AUTHORS } from '@domain/constants/memo-authors.ts';
import { MEMO_TYPES } from '@domain/constants/memo-types.ts';
import { NODE_STATUS } from '@domain/constants/node-status.ts';
import { NODE_TYPES } from '@domain/constants/node-types.ts';
import { graphAddNodeController, graphAppendMemoController, graphDeleteNodeController, graphEditMemoController, graphGetNodeController, graphGetNodesController, graphSearchNodesController, graphUpdateNodeController } from '@src/container.ts';
import { objectId } from './objectIdSchema.ts';
import {
    GRAPH_ADD_NODE_COMMIT_FIELD,
    GRAPH_ADD_NODE_DESCRIPTION,
    GRAPH_ADD_NODE_DESCRIPTION_FIELD,
    GRAPH_ADD_NODE_GRAPH_ID_FIELD,
    GRAPH_ADD_NODE_PATHS_FIELD,
    GRAPH_ADD_NODE_STATUS_FIELD,
    GRAPH_ADD_NODE_TITLE_FIELD,
    GRAPH_ADD_NODE_TYPE_FIELD,
    GRAPH_APPEND_MEMO_AUTHOR_FIELD,
    GRAPH_APPEND_MEMO_DESCRIPTION,
    GRAPH_APPEND_MEMO_ID_FIELD,
    GRAPH_APPEND_MEMO_TEXT_FIELD,
    GRAPH_APPEND_MEMO_TYPE_FIELD,
    GRAPH_DELETE_NODE_DESCRIPTION,
    GRAPH_DELETE_NODE_ID_FIELD,
    GRAPH_EDIT_MEMO_DESCRIPTION,
    GRAPH_EDIT_MEMO_ID_FIELD,
    GRAPH_EDIT_MEMO_TYPE_FIELD,
    GRAPH_GET_NODE_DESCRIPTION,
    GRAPH_GET_NODE_ID_FIELD,
    GRAPH_GET_NODE_TYPES_FIELD,
    GRAPH_GET_NODES_DESCRIPTION,
    GRAPH_GET_NODES_GRAPH_ID_FIELD,
    GRAPH_GET_NODES_LIMIT_FIELD,
    GRAPH_GET_NODES_STATUS_FIELD,
    GRAPH_GET_NODES_TYPES_FIELD,
    GRAPH_SEARCH_NODES_DESCRIPTION,
    GRAPH_SEARCH_NODES_GRAPH_ID_FIELD,
    GRAPH_SEARCH_NODES_LIMIT_FIELD,
    GRAPH_SEARCH_NODES_PATH_FIELD,
    GRAPH_SEARCH_NODES_TEXT_FIELD,
    GRAPH_UPDATE_NODE_COMMIT_FIELD,
    GRAPH_UPDATE_NODE_DESCRIPTION,
    GRAPH_UPDATE_NODE_DESCRIPTION_FIELD,
    GRAPH_UPDATE_NODE_ID_FIELD,
    GRAPH_UPDATE_NODE_PATHS_FIELD,
    GRAPH_UPDATE_NODE_STATUS_FIELD,
    GRAPH_UPDATE_NODE_TITLE_FIELD
} from './serverInstructions.ts';

const NODE_TYPE_VALUES = Object.values(NODE_TYPES).map(nodeType => nodeType.value);
const NODE_STATUS_VALUES = Object.values(NODE_STATUS).map(nodeStatus => nodeStatus.value);
const MEMO_AUTHOR_VALUES = Object.values(MEMO_AUTHORS).map(memoAuthor => memoAuthor.value);
const MEMO_TYPE_VALUES = Object.values(MEMO_TYPES).map(memoType => memoType.value);

export function registerNodeTools (server: McpServer): void {
    server.registerTool(
        'graph-add-node',
        {
            description: GRAPH_ADD_NODE_DESCRIPTION,
            inputSchema: z.object({
                graphId: objectId.describe(GRAPH_ADD_NODE_GRAPH_ID_FIELD),
                type: z.enum(NODE_TYPE_VALUES).describe(GRAPH_ADD_NODE_TYPE_FIELD),
                title: z.string().min(1).describe(GRAPH_ADD_NODE_TITLE_FIELD),
                description: z.string().min(1).describe(GRAPH_ADD_NODE_DESCRIPTION_FIELD),
                status: z.enum(NODE_STATUS_VALUES).describe(GRAPH_ADD_NODE_STATUS_FIELD).default('pending'),
                paths: z.array(z.string().min(1)).optional().describe(GRAPH_ADD_NODE_PATHS_FIELD),
                commit: z.string().min(1).optional().describe(GRAPH_ADD_NODE_COMMIT_FIELD)
            })
        },
        async ({ graphId, type, title, description, status, paths, commit }) => {
            const controller = await graphAddNodeController();
            const response = await controller.handle({ graphId, type, title, description, status, paths, commit });

            const similarNodesLine = response.similarNodesNotice ? `\n${response.similarNodesNotice}` : '';
            const text = response.success && response.node
                ? `Node created successfully: ${response.node.id}${similarNodesLine}`
                : `Failed to add node: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-append-memo',
        {
            description: GRAPH_APPEND_MEMO_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_APPEND_MEMO_ID_FIELD),
                author: z.enum(MEMO_AUTHOR_VALUES).describe(GRAPH_APPEND_MEMO_AUTHOR_FIELD),
                type: z.enum(MEMO_TYPE_VALUES).describe(GRAPH_APPEND_MEMO_TYPE_FIELD),
                text: z.string().min(1).describe(GRAPH_APPEND_MEMO_TEXT_FIELD)
            })
        },
        async ({ id, author, type, text }) => {
            const controller = await graphAppendMemoController();
            const response = await controller.handle({ nodeId: id, author, type, text });

            const memo = response.memo;

            const output = response.success && memo
                ? `Memo appended successfully: ${memo.id}`
                : `Failed to append memo: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text: output }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-edit-memo',
        {
            description: GRAPH_EDIT_MEMO_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_EDIT_MEMO_ID_FIELD),
                type: z.enum(MEMO_TYPE_VALUES).describe(GRAPH_EDIT_MEMO_TYPE_FIELD)
            })
        },
        async ({ id, type }) => {
            const controller = await graphEditMemoController();
            const response = await controller.handle({ id, type });

            const text = response.success
                ? `Memo updated successfully: ${id}`
                : `Failed to update memo: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-get-nodes',
        {
            description: GRAPH_GET_NODES_DESCRIPTION,
            inputSchema: z.object({
                graphId: objectId.describe(GRAPH_GET_NODES_GRAPH_ID_FIELD),
                types: z.array(z.enum(NODE_TYPE_VALUES)).min(1).optional().describe(GRAPH_GET_NODES_TYPES_FIELD),
                status: z.enum(NODE_STATUS_VALUES).optional().describe(GRAPH_GET_NODES_STATUS_FIELD),
                limit: z.number().int().positive().optional().describe(GRAPH_GET_NODES_LIMIT_FIELD)
            })
        },
        async ({ graphId, types, status, limit }) => {
            const controller = await graphGetNodesController();
            const response = await controller.handle({ graphId, types, status, limit });

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
            description: GRAPH_GET_NODE_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_GET_NODE_ID_FIELD),
                types: z.array(z.enum(MEMO_TYPE_VALUES)).min(1).optional().describe(GRAPH_GET_NODE_TYPES_FIELD)
            })
        },
        async ({ id, types }): Promise<{ content: { type: 'text'; text: string; }[]; isError: boolean; }> => {
            const controller = await graphGetNodeController();
            const response = await controller.handle({ id, types });

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
            description: GRAPH_SEARCH_NODES_DESCRIPTION,
            inputSchema: z.object({
                graphId: objectId.describe(GRAPH_SEARCH_NODES_GRAPH_ID_FIELD),
                text: z.string().min(1).optional().describe(GRAPH_SEARCH_NODES_TEXT_FIELD),
                path: z.string().min(1).optional().describe(GRAPH_SEARCH_NODES_PATH_FIELD),
                limit: z.number().int().positive().optional().describe(GRAPH_SEARCH_NODES_LIMIT_FIELD)
            })
        },
        async ({ graphId, text, path, limit }) => {
            const controller = await graphSearchNodesController();
            const response = await controller.handle({ graphId, text, path, limit });

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
            description: GRAPH_UPDATE_NODE_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_UPDATE_NODE_ID_FIELD),
                title: z.string().min(1).optional().describe(GRAPH_UPDATE_NODE_TITLE_FIELD),
                description: z.string().min(1).optional().describe(GRAPH_UPDATE_NODE_DESCRIPTION_FIELD),
                status: z.enum(NODE_STATUS_VALUES).optional().describe(GRAPH_UPDATE_NODE_STATUS_FIELD),
                paths: z.array(z.string().min(1)).optional().describe(GRAPH_UPDATE_NODE_PATHS_FIELD),
                commit: z.string().min(1).optional().describe(GRAPH_UPDATE_NODE_COMMIT_FIELD)
            })
        },
        async ({ id, title, description, status, paths, commit }) => {
            const controller = await graphUpdateNodeController();
            const response = await controller.handle({ id, title, description, status, paths, commit });

            const text = response.success && response.node
                ? `Node updated successfully: ${response.node.id}`
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
            description: GRAPH_DELETE_NODE_DESCRIPTION,
            inputSchema: z.object({
                id: objectId.describe(GRAPH_DELETE_NODE_ID_FIELD)
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

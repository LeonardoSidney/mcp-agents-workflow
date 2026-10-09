import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { MEMO_AUTHORS } from '@domain/constants/memo-authors.ts';
import { NODE_STATUS } from '@domain/constants/node-status.ts';
import { NODE_TYPES } from '@domain/constants/node-types.ts';
import { graphAddNodeController, graphAppendMemoController, graphDeleteNodeController, graphGetNodeController, graphGetNodesController, graphSearchNodesController, graphUpdateNodeController } from '@src/container.ts';
import { objectId } from './objectIdSchema.ts';

const NODE_TYPE_VALUES = Object.values(NODE_TYPES).map(nodeType => nodeType.value);
const NODE_STATUS_VALUES = Object.values(NODE_STATUS).map(nodeStatus => nodeStatus.value);
const MEMO_AUTHOR_VALUES = Object.values(MEMO_AUTHORS).map(memoAuthor => memoAuthor.value);

export function registerNodeTools (server: McpServer): void {
    server.registerTool(
        'graph-add-node',
        {
            description: 'Add a new node to an existing graph. Nodes, edges and memos are independent: after creating the node, use graph-add-edge to connect it to other nodes of the same graph and record the memory on the edge, and graph-append-memo to record the discussion happening on the node',
            inputSchema: z.object({
                graphId: objectId.describe('Graph (project) id this node belongs to (24-hex ObjectId)'),
                type: z.enum(NODE_TYPE_VALUES).describe('Node type'),
                title: z.string().min(1).describe('Node title'),
                description: z.string().min(1).describe('Node description'),
                status: z.enum(NODE_STATUS_VALUES).describe('Initial node status').default('pending')
            })
        },
        async ({ graphId, type, title, description, status }) => {
            const controller = await graphAddNodeController();
            const response = await controller.handle({ graphId, type, title, description, status });

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
        'graph-append-memo',
        {
            description: 'Append a memo to an existing node: one entry of the discussion recorded on the node, with the author declared by the caller. Memos are append-only and survive the node being completed, and are exposed on the node by graph-get-node, graph-get-nodes and graph-search-nodes',
            inputSchema: z.object({
                id: objectId.describe('Node id to append the memo to (24-hex ObjectId)'),
                author: z.enum(MEMO_AUTHOR_VALUES).describe('Speaker of this memo, not the one typing it: "agent" for the agent, "user" for a rule or clarification provided by the user, "system" for the orchestration layer'),
                text: z.string().min(1).describe('Memo text: what was discussed, the difficulty met, or the rule that applies')
            })
        },
        async ({ id, author, text }) => {
            const controller = await graphAppendMemoController();
            const response = await controller.handle({ nodeId: id, author, text });

            const memo = response.memo;

            const output = response.success && memo
                ? `Memo appended successfully.\n${JSON.stringify(memo, null, 4)}`
                : `Failed to append memo: ${response.error ?? 'Unknown error'}`;

            return {
                content: [{ type: 'text' as const, text: output }],
                isError: !response.success
            };
        }
    );

    server.registerTool(
        'graph-get-nodes',
        {
            description: 'List the nodes of a graph (project), ordered by the most recently updated first, optionally filtered by type and status and capped by a limit. Returns node and outgoing edge descriptions only - never memo text; read the discussion of a node with graph-get-node',
            inputSchema: z.object({
                graphId: objectId.describe('Graph (project) id whose nodes should be listed (24-hex ObjectId)'),
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
            description: 'Fetch a single node from the agent workflow graph by id (24-hex ObjectId)',
            inputSchema: z.object({
                id: objectId.describe('Node id (24-hex ObjectId)')
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
            description: 'Search the nodes of a graph (project) by text across title, description, and memories recorded on the node outgoing edges and memos appended to the node, ranked by similarity. Each result exposes titleScore, descriptionScore, memoryScore and the combined score. Use short meaningful tokens without articles or connectivities from any language (e.g. "calculo vale refeicao", not "calculo do vale refeicao"); connectivities match almost everything, so keep the query short or cap the result count with limit. Each hit carries the full text of the single best-matching memo of the node as bestMemo (omitted when no memo matches); the rest of the discussion of a node is read with graph-get-node.',
            inputSchema: z.object({
                graphId: objectId.describe('Graph (project) id whose nodes should be searched (24-hex ObjectId)'),
                text: z.string().min(1).describe('Text to match across title, description, and memories (outgoing edge descriptions), as short meaningful tokens'),
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
            description: 'Update an existing node by id (24-hex ObjectId). Provide only the fields to change; omitted fields keep their current value. Edges are independent of nodes: updating a node never touches its edges, and node type cannot be changed.',
            inputSchema: z.object({
                id: objectId.describe('Node id to update (24-hex ObjectId)'),
                title: z.string().min(1).optional().describe('New node title (omit to keep current)'),
                description: z.string().min(1).optional().describe('New node description (omit to keep current)'),
                status: z.enum(NODE_STATUS_VALUES).optional().describe('New node status (omit to keep current)')
            })
        },
        async ({ id, title, description, status }) => {
            const controller = await graphUpdateNodeController();
            const response = await controller.handle({ id, title, description, status });

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
            description: 'Delete a node from the agent workflow graph by id (24-hex ObjectId). Refuses deletion while any edge is attached to the node (incoming or outgoing), because deleting it would erase the recorded graph memory; delete those edges first with graph-delete-edge',
            inputSchema: z.object({
                id: objectId.describe('Node id to delete (24-hex ObjectId)')
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

import { McpServer } from '@modelcontextprotocol/server';
import { registerEdgeTools } from './mcp/edgeTools.ts';
import { registerGraphTools } from './mcp/graphTools.ts';
import { registerNodeTools } from './mcp/nodeTools.ts';
import { SERVER_INSTRUCTIONS } from './mcp/serverInstructions.ts';

export function createServer (): McpServer {
    const server = new McpServer(
        { name: 'mcp-agents-workflow', version: '1.0.0' },
        { instructions: SERVER_INSTRUCTIONS }
    );

    registerGraphTools(server);
    registerNodeTools(server);
    registerEdgeTools(server);

    return server;
}

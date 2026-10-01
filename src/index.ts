import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './mcpServer.ts';

serveStdio(createServer);

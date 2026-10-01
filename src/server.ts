import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer as createHttpServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { shutdownDatabase } from './boot.ts';
import { createServer } from './mcpServer.ts';

const PORT = Number(process.env['PORT']) || 3000;

const handler = createMcpHandler(() => createServer());

function collectRequestBody (request: IncomingMessage): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        request.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        request.on('end', () => {
            resolve(new Uint8Array(Buffer.concat(chunks)));
        });

        request.on('error', (error: Error) => {
            reject(error);
        });
    });
}

function toWebHeaders (request: IncomingMessage): Headers {
    const headers = new Headers();

    for (const [name, value] of Object.entries(request.headers)) {
        if (value === undefined) {
            continue;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                headers.append(name, item);
            }
            continue;
        }

        headers.append(name, value);
    }

    return headers;
}

function buildRequestUrl (request: IncomingMessage): string {
    const hostHeader = request.headers['host'];
    const host = hostHeader ?? `localhost:${PORT}`;
    const path = request.url ?? '/';

    return `http://${host}${path}`;
}

function toWebRequest (request: IncomingMessage, body: Uint8Array): Request {
    const method = request.method?.toUpperCase() ?? 'GET';
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const requestBody = hasBody ? body : undefined;

    return new Request(buildRequestUrl(request), {
        method,
        headers: toWebHeaders(request),
        body: requestBody
    });
}

async function writeWebResponse (response: ServerResponse, result: Response): Promise<void> {
    response.statusCode = result.status;

    for (const [name, value] of result.headers.entries()) {
        response.setHeader(name, value);
    }

    if (result.body === null) {
        response.end();
        return;
    }

    const reader = result.body.getReader();

    for (; ;) {
        const chunk = await reader.read();
        if (chunk.done) {
            break;
        }

        response.write(chunk.value);
    }

    response.end();
}

function rejectRequest (response: ServerResponse, error: unknown): void {
    if (response.headersSent) {
        response.destroy(error instanceof Error ? error : undefined);
        return;
    }

    console.error(error);

    response.statusCode = 500;
    response.setHeader('Content-Type', 'text/plain');
    response.end('Internal server error');
}

async function serveMcpRequest (request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await collectRequestBody(request);
    const webRequest = toWebRequest(request, body);
    const webResponse = await handler.fetch(webRequest);

    await writeWebResponse(response, webResponse);
}

function handleRequest (request: IncomingMessage, response: ServerResponse): void {
    serveMcpRequest(request, response)
        .catch((error: unknown) => {
            rejectRequest(response, error);
        });
}

const httpServer = createHttpServer(handleRequest);

httpServer.listen(PORT, () => {
    console.log(`MCP server (Streamable HTTP) listening on http://localhost:${PORT}/mcp`);
});

async function shutdown (): Promise<void> {
    await handler.close();
    await shutdownDatabase();

    await new Promise<void>((resolve) => {
        httpServer.close(() => {
            resolve();
        });
        httpServer.closeAllConnections();
    });
}

function requestShutdown (): void {
    void shutdown()
        .then(() => {
            process.exit(0);
        })
        .catch((error: unknown) => {
            console.error(error);
            process.exit(1);
        });
}

process.on('SIGTERM', requestShutdown);
process.on('SIGINT', requestShutdown);

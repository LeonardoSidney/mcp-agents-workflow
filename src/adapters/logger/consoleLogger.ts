import type { ILogger } from '@domain/logger.ts';

export class ConsoleLogger implements ILogger {
    info (message: string, data?: unknown): void {
        const payload = data === undefined ? message : `${message} ${JSON.stringify(data)}`;

        process.stderr.write(`[info]: ${payload}\n`);
    }
}

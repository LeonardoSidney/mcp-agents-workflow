import type { ILogger } from '@domain/logger.ts';

export class NoopLogger implements ILogger {
    info (): void {
    }
}

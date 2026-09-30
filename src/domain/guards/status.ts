import { STATUS } from '@domain/constants/status.ts';
import type { Status } from '@domain/constants/status.ts';

export function isStatus (value: string): value is Status {
    return Object.values(STATUS).some(definition => definition.value === value);
}

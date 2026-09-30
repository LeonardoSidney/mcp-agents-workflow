import type { Status } from '@domain/constants/status.ts';

export type Project = {
    name: string;
    description: string;
    status: Status;
};

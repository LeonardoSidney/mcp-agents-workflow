import type { Status } from '@domain/constants/status.ts';

export type Project = {
    id: string;
    name: string;
    description: string;
    status: Status;
};

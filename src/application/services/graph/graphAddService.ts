import { randomUUID } from 'node:crypto';
import { isStatus } from '@domain/guards/status.ts';
import type { Status } from '@domain/constants/status.ts';
import type { Project } from '@domain/entities/project.ts';
import type { GraphAddServiceParams, GraphAddServiceResponse, IGraphAddService } from '@domain/services/iGraphAddService.ts';

export class GraphAddService implements IGraphAddService {
    mapProject (params: GraphAddServiceParams): GraphAddServiceResponse {
        const validationError = this.validateStatus(params.status);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const project: Project = {
            id: randomUUID(),
            name: params.name,
            description: params.description,
            status: params.status
        };

        return {
            success: true,
            project
        };
    }

    private validateStatus (status: Status): string | undefined {
        if (!isStatus(status)) {
            return 'Invalid project status';
        }

        return undefined;
    }
}


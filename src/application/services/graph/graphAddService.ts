import { STATUS } from '@domain/constants/status.ts';
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
        const values = Object.values(STATUS) as readonly { value: string; description: string; }[];
        const isValid = values.some(s => s.value === status);
        if (!isValid) {
            return 'Invalid project status';
        }

        return undefined;
    }
}


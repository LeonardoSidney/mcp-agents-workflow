import { randomUUID } from 'node:crypto';
import type { Project } from '@domain/entities/project.ts';
import type { GraphAddServiceParams, GraphAddServiceResponse, IGraphAddService } from '@domain/services/iGraphAddService.ts';

export class GraphAddService implements IGraphAddService {
    mapProject (params: GraphAddServiceParams): GraphAddServiceResponse {
        const project: Project = {
            id: randomUUID(),
            name: params.name,
            description: params.description
        };

        return {
            success: true,
            project
        };
    }
}


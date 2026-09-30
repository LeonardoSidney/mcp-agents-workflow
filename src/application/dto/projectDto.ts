import type { ProjectDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Project } from '@domain/entities/project.ts';

export class ProjectDTO {
    static to_mongodb (project: Project): ProjectDocument {
        const now = new Date();

        return {
            name: project.name,
            description: project.description,
            status: project.status,
            created_at: now,
            updated_at: now
        };
    }
}

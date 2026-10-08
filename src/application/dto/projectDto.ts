import type { ProjectDocument } from '@domain/gateways/iDatabaseGateway.ts';
import type { Project } from '@domain/entities/project.ts';

export class ProjectDTO {
    static to_mongodb (project: Project): ProjectDocument {
        const now = new Date();

        return {
            id: project.id,
            name: project.name,
            description: project.description,
            created_at: now,
            updated_at: now
        };
    }

    static to_domain (document: ProjectDocument): Project {
        return {
            id: document.id,
            name: document.name,
            description: document.description
        };
    }
}

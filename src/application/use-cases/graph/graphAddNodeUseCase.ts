import type { ILogger } from '@domain/logger.ts';
import type { IGraphAddNodeService } from '@domain/services/iGraphAddNodeService.ts';
import type { IProjectRepository } from '@domain/repository/iProjectRepository.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { GraphAddNodeUseCaseParams, GraphAddNodeUseCaseResponse, IGraphAddNodeUseCase } from '@domain/use-cases/iGraphAddNodeUseCase.ts';

export class GraphAddNodeUseCase implements IGraphAddNodeUseCase {
    private readonly logger: ILogger;
    private readonly graphAddNodeService: IGraphAddNodeService;
    private readonly projectRepository: IProjectRepository;
    private readonly nodeRepository: INodeRepository;

    constructor (
        logger: ILogger,
        graphAddNodeService: IGraphAddNodeService,
        projectRepository: IProjectRepository,
        nodeRepository: INodeRepository
    ) {
        this.logger = logger;
        this.graphAddNodeService = graphAddNodeService;
        this.projectRepository = projectRepository;
        this.nodeRepository = nodeRepository;
    }

    async execute (params: GraphAddNodeUseCaseParams): Promise<GraphAddNodeUseCaseResponse> {
        this.logger.info('Executing GraphAddNodeUseCase::execute');

        const validationError = this.validate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const graph = await this.projectRepository.getProject({ id: params.graphId });
        if (!graph) {
            return {
                success: false,
                error: `Graph not found: ${params.graphId}`
            };
        }

        const edgeError = await this.validateEdges(params);
        if (edgeError) {
            return {
                success: false,
                error: edgeError
            };
        }

        const mapped = this.graphAddNodeService.mapNode(params);
        if (!mapped.success || !mapped.node) {
            return {
                success: false,
                error: mapped.error ?? 'Failed to map the node'
            };
        }

        await this.nodeRepository.addNode({ node: mapped.node, edges: mapped.edges ?? [] });

        return {
            success: true,
            node: { ...mapped.node, edges: mapped.edges ?? [] }
        };
    }

    private async validateEdges (params: GraphAddNodeUseCaseParams): Promise<string | undefined> {
        for (const edge of params.edges) {
            if (!edge.targetId?.trim()) {
                return 'A non-empty node link target id is required';
            }

            const target = await this.nodeRepository.getNode({ id: edge.targetId });
            if (!target) {
                return `Node link target not found: ${edge.targetId}`;
            }

            if (target.graphId !== params.graphId) {
                return `Node link target does not belong to graph ${params.graphId}: ${edge.targetId}`;
            }
        }

        return undefined;
    }

    private validate (params: GraphAddNodeUseCaseParams): string | undefined {
        if (!params.graphId?.trim()) {
            return 'A non-empty graph id is required';
        }

        if (!params.title?.trim()) {
            return 'A non-empty title is required';
        }

        if (!params.description?.trim()) {
            return 'A non-empty description is required';
        }

        return undefined;
    }
}

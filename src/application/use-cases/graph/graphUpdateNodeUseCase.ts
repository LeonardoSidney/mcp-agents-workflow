import type { ILogger } from '@domain/logger.ts';
import type { IGraphUpdateNodeService } from '@domain/services/iGraphUpdateNodeService.ts';
import type { INodeRepository } from '@domain/repository/iNodeRepository.ts';
import type { GraphUpdateNodeUseCaseParams, GraphUpdateNodeUseCaseResponse, IGraphUpdateNodeUseCase } from '@domain/use-cases/iGraphUpdateNodeUseCase.ts';

export class GraphUpdateNodeUseCase implements IGraphUpdateNodeUseCase {
    private readonly logger: ILogger;
    private readonly graphUpdateNodeService: IGraphUpdateNodeService;
    private readonly nodeRepository: INodeRepository;

    constructor (
        logger: ILogger,
        graphUpdateNodeService: IGraphUpdateNodeService,
        nodeRepository: INodeRepository
    ) {
        this.logger = logger;
        this.graphUpdateNodeService = graphUpdateNodeService;
        this.nodeRepository = nodeRepository;
    }

    async execute (params: GraphUpdateNodeUseCaseParams): Promise<GraphUpdateNodeUseCaseResponse> {
        this.logger.info('Executing GraphUpdateNodeUseCase::execute');

        const validationError = this.validate(params);
        if (validationError) {
            return {
                success: false,
                error: validationError
            };
        }

        const node = await this.nodeRepository.getNode({ id: params.id });
        if (!node) {
            return {
                success: false,
                error: `Node not found: ${params.id}`
            };
        }

        let edgeError: string | undefined;
        if (params.edges !== undefined) {
            edgeError = await this.validateEdges(params, node.graphId);
        }
        if (edgeError) {
            return {
                success: false,
                error: edgeError
            };
        }

        const mapped = this.graphUpdateNodeService.mapUpdate({
            node,
            title: params.title,
            description: params.description,
            status: params.status,
            edges: params.edges
        });
        if (!mapped.success || !mapped.node) {
            return {
                success: false,
                error: mapped.error ?? 'Failed to map the node update'
            };
        }

        const persisted = await this.nodeRepository.updateNode({ node: mapped.node, edges: mapped.edges });
        if (!persisted) {
            return {
                success: false,
                error: `Node not found: ${params.id}`
            };
        }

        return {
            success: true,
            node: { ...mapped.node, edges: params.edges ?? node.edges }
        };
    }

    private async validateEdges (params: GraphUpdateNodeUseCaseParams, graphId: string): Promise<string | undefined> {
        for (const edge of params.edges ?? []) {
            if (!edge.targetId?.trim()) {
                return 'A non-empty node link target id is required';
            }

            const target = await this.nodeRepository.getNode({ id: edge.targetId });
            if (!target) {
                return `Node link target not found: ${edge.targetId}`;
            }

            if (target.graphId !== graphId) {
                return `Node link target does not belong to graph ${graphId}: ${edge.targetId}`;
            }
        }

        return undefined;
    }

    private validate (params: GraphUpdateNodeUseCaseParams): string | undefined {
        if (!params.id?.trim()) {
            return 'A non-empty node id is required';
        }

        if (params.title === undefined
            && params.description === undefined
            && params.status === undefined
            && params.edges === undefined) {
            return 'At least one field must be provided to update a node';
        }

        if (params.title !== undefined && !params.title.trim()) {
            return 'A non-empty title is required';
        }

        if (params.description !== undefined && !params.description.trim()) {
            return 'A non-empty description is required';
        }

        return undefined;
    }
}

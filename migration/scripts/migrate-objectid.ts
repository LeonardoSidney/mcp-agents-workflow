import { MongoClient, ObjectId } from 'mongodb';
import type { AnyBulkWriteOperation } from 'mongodb';

type ProjectRaw = {
    _id: ObjectId;
    id?: string;
};

type NodeRaw = {
    _id: ObjectId;
    graph_id: string;
    id?: string;
};

type EdgeRaw = {
    _id: ObjectId;
    graph_id: string;
    source_id: string;
    target_id: string;
    id?: string;
};

type MemoRaw = {
    _id: ObjectId;
    node_id: string;
    id?: string;
};

const MONGODB_URI = process.env['MONGODB_URI'] ?? 'mongodb://127.0.0.1:27017/mcp-agents-workflow';
const APPLY = process.argv.includes('--apply');

async function main (): Promise<void> {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    try {
        await migrate(client);
    } finally {
        await client.close();
    }
}

async function migrate (client: MongoClient): Promise<void> {
    console.log(`[migrate] mode: ${APPLY ? 'apply' : 'dry run'} | database: ${MONGODB_URI}`);

    const db = client.db();
    const projectCollection = db.collection<ProjectRaw>('projects');
    const nodeCollection = db.collection<NodeRaw>('nodes');
    const edgeCollection = db.collection<EdgeRaw>('edges');
    const memoCollection = db.collection<MemoRaw>('memos');

    const [projects, nodes, edges, memos] = await Promise.all([
        projectCollection.find({}).toArray(),
        nodeCollection.find({}).toArray(),
        edgeCollection.find({}).toArray(),
        memoCollection.find({}).toArray()
    ]);

    const projectIds = buildIdMap(projects, 'projects');
    const nodeIds = buildIdMap(nodes, 'nodes');

    const problems = [
        ...validateNodeReferences(nodes, projectIds),
        ...validateEdgeReferences(edges, projectIds, nodeIds),
        ...validateMemoReferences(memos, nodeIds)
    ];

    if (problems.length > 0) {
        for (const problem of problems) {
            console.log(`[migrate] UNSOLVED REFERENCE - ${problem}`);
        }

        throw new Error(`${problems.length} unresolved reference(s) - aborted, nothing was written`);
    }

    const projectOps = buildProjectOps(projects);
    const nodeOps = buildNodeOps(nodes, projectIds);
    const edgeOps = buildEdgeOps(edges, projectIds, nodeIds);
    const memoOps = buildMemoOps(memos, nodeIds);

    logCollectionCount('projects', projects, projectOps.length);
    logCollectionCount('nodes', nodes, nodeOps.length);
    logCollectionCount('edges', edges, edgeOps.length);
    logCollectionCount('memos', memos, memoOps.length);

    if (!APPLY) {
        console.log('[migrate] dry run: no writes - re-run with --apply to commit');
        return;
    }

    if (projectOps.length > 0) {
        await projectCollection.bulkWrite(projectOps, { ordered: true });
    }

    if (nodeOps.length > 0) {
        await nodeCollection.bulkWrite(nodeOps, { ordered: true });
    }

    if (edgeOps.length > 0) {
        await edgeCollection.bulkWrite(edgeOps, { ordered: true });
    }

    if (memoOps.length > 0) {
        await memoCollection.bulkWrite(memoOps, { ordered: true });
    }

    const leftovers = await Promise.all([
        projectCollection.countDocuments({ id: {} }),
        nodeCollection.countDocuments({ id: {} }),
        edgeCollection.countDocuments({ id: {} }),
        memoCollection.countDocuments({ id: {} })
    ]);

    if (leftovers.some(count => count > 0)) {
        throw new Error(`post-check failed - documents with a legacy id field remain: ${leftovers.join(', ')}`);
    }

    console.log('[migrate] done: references mapped to _id and legacy id fields removed');
}

function buildIdMap<T extends { _id: ObjectId; id?: string; }> (docs: T[], label: string): Map<string, string> {
    const map = new Map<string, string>();

    for (const doc of docs) {
        if (typeof doc.id !== 'string') {
            continue;
        }

        if (map.has(doc.id)) {
            throw new Error(`duplicate legacy id "${doc.id}" in ${label}`);
        }

        map.set(doc.id, doc._id.toHexString());
    }

    return map;
}

function validateNodeReferences (nodes: NodeRaw[], projectIds: Map<string, string>): string[] {
    const problems: string[] = [];

    for (const node of nodes) {
        if (typeof node.id !== 'string') {
            continue;
        }

        if (!projectIds.has(node.graph_id)) {
            problems.push(`nodes ${node._id.toHexString()}: graph_id "${node.graph_id}" does not resolve to a project id`);
        }
    }

    return problems;
}

function validateEdgeReferences (edges: EdgeRaw[], projectIds: Map<string, string>, nodeIds: Map<string, string>): string[] {
    const problems: string[] = [];

    for (const edge of edges) {
        if (typeof edge.id !== 'string') {
            continue;
        }

        if (!projectIds.has(edge.graph_id)) {
            problems.push(`edges ${edge._id.toHexString()}: graph_id "${edge.graph_id}" does not resolve to a project id`);
        }

        if (!nodeIds.has(edge.source_id)) {
            problems.push(`edges ${edge._id.toHexString()}: source_id "${edge.source_id}" does not resolve to a node id`);
        }

        if (!nodeIds.has(edge.target_id)) {
            problems.push(`edges ${edge._id.toHexString()}: target_id "${edge.target_id}" does not resolve to a node id`);
        }
    }

    return problems;
}

function validateMemoReferences (memos: MemoRaw[], nodeIds: Map<string, string>): string[] {
    const problems: string[] = [];

    for (const memo of memos) {
        if (typeof memo.id !== 'string') {
            continue;
        }

        if (!nodeIds.has(memo.node_id)) {
            problems.push(`memos ${memo._id.toHexString()}: node_id "${memo.node_id}" does not resolve to a node id`);
        }
    }

    return problems;
}

function buildProjectOps (projects: ProjectRaw[]): AnyBulkWriteOperation<ProjectRaw>[] {
    return projects
        .filter(project => typeof project.id === 'string')
        .map(project => ({
            updateOne: {
                filter: { _id: project._id },
                update: {
                    $unset: { id: '' }
                }
            }
        }));
}

function buildNodeOps (nodes: NodeRaw[], projectIds: Map<string, string>): AnyBulkWriteOperation<NodeRaw>[] {
    return nodes
        .filter(node => typeof node.id === 'string')
        .map(node => {
            const graphId = projectIds.get(node.graph_id);
            if (graphId === undefined) {
                throw new Error(`nodes ${node._id.toHexString()}: graph_id "${node.graph_id}" does not resolve to a project id`);
            }

            return {
                updateOne: {
                    filter: { _id: node._id },
                    update: {
                        $set: { graph_id: graphId },
                        $unset: { id: '' }
                    }
                }
            };
        });
}

function buildEdgeOps (edges: EdgeRaw[], projectIds: Map<string, string>, nodeIds: Map<string, string>): AnyBulkWriteOperation<EdgeRaw>[] {
    return edges
        .filter(edge => typeof edge.id === 'string')
        .map(edge => {
            const graphId = projectIds.get(edge.graph_id);
            const sourceId = nodeIds.get(edge.source_id);
            const targetId = nodeIds.get(edge.target_id);

            if (graphId === undefined || sourceId === undefined || targetId === undefined) {
                throw new Error(`edges ${edge._id.toHexString()}: a reference does not resolve (graph_id "${edge.graph_id}", source_id "${edge.source_id}", target_id "${edge.target_id}")`);
            }

            return {
                updateOne: {
                    filter: { _id: edge._id },
                    update: {
                        $set: { graph_id: graphId, source_id: sourceId, target_id: targetId },
                        $unset: { id: '' }
                    }
                }
            };
        });
}

function buildMemoOps (memos: MemoRaw[], nodeIds: Map<string, string>): AnyBulkWriteOperation<MemoRaw>[] {
    return memos
        .filter(memo => typeof memo.id === 'string')
        .map(memo => {
            const nodeId = nodeIds.get(memo.node_id);
            if (nodeId === undefined) {
                throw new Error(`memos ${memo._id.toHexString()}: node_id "${memo.node_id}" does not resolve to a node id`);
            }

            return {
                updateOne: {
                    filter: { _id: memo._id },
                    update: {
                        $set: { node_id: nodeId },
                        $unset: { id: '' }
                    }
                }
            };
        });
}

function logCollectionCount<T extends { id?: string; }> (label: string, docs: T[], plannedUpdates: number): void {
    const pending = docs.filter(doc => typeof doc.id === 'string').length;
    const alreadyMigrated = docs.length - pending;

    console.log(`[migrate] ${label}: ${pending} pending, ${alreadyMigrated} already migrated -> ${plannedUpdates} update(s) planned`);
}

main()
    .catch((reason: unknown) => {
        console.error('[migrate] failed:', reason);
        process.exit(1);
    });

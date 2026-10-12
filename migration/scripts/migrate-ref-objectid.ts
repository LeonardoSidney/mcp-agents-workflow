import { MongoClient, ObjectId } from 'mongodb';
import type { AnyBulkWriteOperation } from 'mongodb';

const HEX = /^[0-9a-f]{24}$/i;

type ProjectRaw = {
    _id: ObjectId;
};

type NodeRaw = {
    _id: ObjectId;
    graph_id: string | ObjectId;
};

type EdgeRaw = {
    _id: ObjectId;
    graph_id: string | ObjectId;
    source_id: string | ObjectId;
    target_id: string | ObjectId;
};

type MemoRaw = {
    _id: ObjectId;
    node_id: string | ObjectId;
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

    const projectHex = hexSet(projects);
    const nodeHex = hexSet(nodes);

    const problems = [
        ...validateField(nodes, 'nodes', 'graph_id', 'project', d => d.graph_id, projectHex),
        ...validateField(edges, 'edges', 'graph_id', 'project', d => d.graph_id, projectHex),
        ...validateField(edges, 'edges', 'source_id', 'node', d => d.source_id, nodeHex),
        ...validateField(edges, 'edges', 'target_id', 'node', d => d.target_id, nodeHex),
        ...validateField(memos, 'memos', 'node_id', 'node', d => d.node_id, nodeHex)
    ];

    if (problems.length > 0) {
        for (const problem of problems) {
            console.log(`[migrate] UNSOLVED REFERENCE - ${problem}`);
        }

        throw new Error(`${problems.length} unresolved reference(s) - aborted, nothing was written`);
    }

    const nodeOps = buildNodeOps(nodes);
    const edgeOps = buildEdgeOps(edges);
    const memoOps = buildMemoOps(memos);

    logPending('nodes', nodes, node => typeof node.graph_id === 'string');
    logPending('edges', edges, edge => typeof edge.graph_id === 'string' || typeof edge.source_id === 'string' || typeof edge.target_id === 'string');
    logPending('memos', memos, memo => typeof memo.node_id === 'string');

    if (!APPLY) {
        console.log('[migrate] dry run: no writes - re-run with --apply to commit');
        return;
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
        nodeCollection.countDocuments({ graph_id: { $type: 'string' } }),
        edgeCollection.countDocuments({ graph_id: { $type: 'string' } }),
        edgeCollection.countDocuments({ source_id: { $type: 'string' } }),
        edgeCollection.countDocuments({ target_id: { $type: 'string' } }),
        memoCollection.countDocuments({ node_id: { $type: 'string' } })
    ]);

    if (leftovers.some(count => count > 0)) {
        throw new Error(`post-check failed - documents with string references remain: ${leftovers.join(', ')}`);
    }

    console.log('[migrate] done: all reference fields now store ObjectIds');
}

function hexSet (documents: { _id: ObjectId; }[]): Set<string> {
    return new Set(documents.map(doc => doc._id.toHexString()));
}

function validateField<T extends { _id: ObjectId; }> (
    documents: T[],
    label: string,
    field: string,
    target: string,
    pick: (doc: T) => string | ObjectId,
    targets: Set<string>
): string[] {
    const problems: string[] = [];

    for (const doc of documents) {
        const ref = pick(doc);
        if (typeof ref !== 'string') {
            continue;
        }

        if (!HEX.test(ref) || !targets.has(ref)) {
            problems.push(`${label} ${doc._id.toHexString()}: ${field} "${ref}" does not resolve to a ${target} _id`);
        }
    }

    return problems;
}

function buildNodeOps (nodes: NodeRaw[]): AnyBulkWriteOperation<NodeRaw>[] {
    return nodes
        .filter(node => typeof node.graph_id === 'string')
        .map(node => ({
            updateOne: {
                filter: { _id: node._id },
                update: {
                    $set: { graph_id: new ObjectId(node.graph_id) }
                }
            }
        }));
}

function buildEdgeOps (edges: EdgeRaw[]): AnyBulkWriteOperation<EdgeRaw>[] {
    const ops: AnyBulkWriteOperation<EdgeRaw>[] = [];

    for (const edge of edges) {
        const set: { graph_id?: ObjectId; source_id?: ObjectId; target_id?: ObjectId; } = {};
        if (typeof edge.graph_id === 'string') {
            set.graph_id = new ObjectId(edge.graph_id);
        }
        if (typeof edge.source_id === 'string') {
            set.source_id = new ObjectId(edge.source_id);
        }
        if (typeof edge.target_id === 'string') {
            set.target_id = new ObjectId(edge.target_id);
        }

        if (Object.keys(set).length === 0) {
            continue;
        }

        ops.push({
            updateOne: {
                filter: { _id: edge._id },
                update: { $set: set }
            }
        });
    }

    return ops;
}

function buildMemoOps (memos: MemoRaw[]): AnyBulkWriteOperation<MemoRaw>[] {
    return memos
        .filter(memo => typeof memo.node_id === 'string')
        .map(memo => ({
            updateOne: {
                filter: { _id: memo._id },
                update: {
                    $set: { node_id: new ObjectId(memo.node_id) }
                }
            }
        }));
}

function logPending<T> (label: string, docs: T[], isPending: (doc: T) => boolean): void {
    const pending = docs.filter(isPending).length;
    const alreadyMigrated = docs.length - pending;

    console.log(`[migrate] ${label}: ${pending} pending, ${alreadyMigrated} already migrated`);
}

main()
    .catch((reason: unknown) => {
        console.error('[migrate] failed:', reason);
        process.exit(1);
    });

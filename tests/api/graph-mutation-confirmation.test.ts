import { mcpTestHarness } from './mcpHarness.ts';

const { addEdge, addNode, addProject, callTool, textOf } = mcpTestHarness();

describe('MCP server - mutation tool responses', () => {
  test('graph-add confirms with the id only, without echoing the project', async () => {
    const result = await callTool('graph-add', { name: 'Confirmation Project', description: 'Project used to check the confirmation' });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Project created successfully: [0-9a-f]{24}$/);
  });

  test('graph-add-node confirms with the id only, without echoing the node', async () => {
    const graph = await addProject('Node Confirmation Project', 'Project used to check node confirmations');
    const result = await callTool('graph-add-node', {
      graphId: graph.id,
      type: 'GOAL',
      title: 'Confirmation goal',
      description: 'Goal used to check the confirmation'
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Node created successfully: [0-9a-f]{24}$/);
  });

  test('graph-add-edge confirms with the id only, without echoing the edge', async () => {
    const graph = await addProject('Edge Confirmation Project', 'Project used to check edge confirmations');
    const source = await addNode(graph.id, 'TASK', 'Source task', 'Task used in the confirmation edge');
    const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal used in the confirmation edge');
    const result = await callTool('graph-add-edge', {
      graphId: graph.id,
      sourceId: source.id,
      targetId: target.id,
      type: 'PART_OF'
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Edge created successfully: [0-9a-f]{24}$/);
  });

  test('graph-update-node confirms with the id only, without echoing the node', async () => {
    const graph = await addProject('Update Confirmation Project', 'Project used to check update confirmations');
    const node = await addNode(graph.id, 'TASK', 'Confirmed task', 'Task used to check the update confirmation');
    const result = await callTool('graph-update-node', { id: node.id, status: 'in_progress' });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Node updated successfully: [0-9a-f]{24}$/);
  });

  test('graph-update-edge confirms with the id only, without echoing the edge', async () => {
    const graph = await addProject('Edge Update Confirmation Project', 'Project used to check edge update confirmations');
    const source = await addNode(graph.id, 'TASK', 'Source task', 'Task that owns the confirmed edge');
    const target = await addNode(graph.id, 'GOAL', 'Target goal', 'Goal pointed by the confirmed edge');
    const edge = await addEdge(graph.id, source.id, target.id, 'PART_OF');
    const result = await callTool('graph-update-edge', { id: edge.id, description: 'Confirmed memory' });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Edge updated successfully: [0-9a-f]{24}$/);
  });

  test('graph-append-memo confirms with the id only, without echoing the memo', async () => {
    const graph = await addProject('Memo Confirmation Project', 'Project used to check memo confirmations');
    const node = await addNode(graph.id, 'TASK', 'Memoed task', 'Task used to check the memo confirmation');
    const result = await callTool('graph-append-memo', { id: node.id, author: 'agent', text: 'A confirmation memo' });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/^Memo appended successfully: [0-9a-f]{24}$/);
  });
});

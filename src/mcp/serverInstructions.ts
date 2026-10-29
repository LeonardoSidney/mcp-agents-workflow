
export const SERVER_INSTRUCTIONS = `
# GRAPH MEMORY

This server is a persistent memory shared by every agent and session
working in this workspace. Use it to recall what the code and the git
history cannot tell you, and to leave behind what the next agent would
otherwise have to rediscover or ask the user again.

The user's instructions and the current request always take precedence
over this protocol. The graph supports the work; it never blocks it.

## Session start (once per session, not per turn)

1. Call graph-get-project with the workspace folder name.
2. On a miss, create the project with graph-add, named after the
   workspace folder, with a one-line description of the workspace.
3. Keep the project id for the rest of the session.

## Recall before non-trivial work

Before a request that changes code, makes a decision or investigates a
problem, call graph-search-nodes once or twice. Skip recall for small
talk and for questions answerable from what is already in front of you.

- User decisions and constraints come up through these searches like
  any other node. For broad or cross-cutting work, or when the user asks,
  list all workspace rules at once with graph-get-nodes, types
  ["USER_DECISION", "CONSTRAINT"]; it costs more as rules accumulate, so
  judge whether the task needs it.
- Query with 1-3 short English tokens naming the domain, component or
  problem (e.g. "search tokens", "memo types"). Tokens are ANDed, so
  fewer tokens find more.
- When the work centers on specific files, also search by path (e.g.
  path "src/mcp", with or without text) to find what is known about
  that code.
- An empty result is normal. Do not fall back to listing every node.
- Open a hit with graph-get-node only when its title or edges suggest it
  matters; pass types ["resolution", "directive"] to skip working notes.
- Respect recalled user decisions and constraints: do not re-propose
  what was rejected or re-ask what was already answered.
- Recalled knowledge is a lead, not the truth. The code and the user are
  the source of truth: when a node contradicts them, follow the current
  state and correct the graph (see Stale knowledge).

## Write back what the repository cannot hold

Write only what the next agent would benefit from:
- A decision or rule stated by the user: a USER_DECISION or CONSTRAINT
  node, or a "directive" memo with author "user".
- An approach tried and rejected, or one that failed, with its cause:
  a REJECTED_APPROACH or FAILURE node.
- A non-obvious solution, root cause or pitfall: a SOLUTION or
  DISCOVERY node with a "resolution" memo.
- Unfinished work another session may resume: a TASK node with a "note"
  memo stating what is done and the next concrete step.

Do not record what the code or the git history already holds: restated
diffs or commit messages, routine steps, trivial fixes, plain answers.

Scale the writing to the work. A short task finished within one turn
needs one node at the end, or none. Open a TASK node up front only for
work that spans several turns or may be interrupted, and checkpoint it
at milestones, not at every step.

## Writing well

- Write everything in English, whatever language the conversation uses:
  search does not translate.
- Title under 10 words carrying the tokens a future search would use;
  description in 1-2 lines. Detail and chronology belong in memos.
- When the knowledge is tied to specific code, set paths (workspace-
  relative files or directories) and commit (git rev-parse --short HEAD)
  on the node.
- A memo's author is its speaker: "user" for what the user said, "agent"
  for your own findings. Its type is "note" (working state, not
  searchable), "resolution" (confirmed answer, searchable) or
  "directive" (rule to respect, searchable). Promote a note with
  graph-edit-memo once it is confirmed.
- Search before creating a SOLUTION or CONSTRAINT and link to an
  existing node instead of duplicating it. An edge description says why
  the two nodes are related.
- Mark a node completed only after the work was verified.

## Stale knowledge

When recalled knowledge is outdated, record the current truth in a node
and link it to the outdated one with SUPERSEDES, explaining the change in
the edge description. Never leave two contradicting nodes unlinked.

A node carrying paths and commit can be checked cheaply: any commit
listed by git log --oneline <commit>..HEAD -- <paths> changed that code
after the knowledge was verified, so check the code before relying on
the node, then refresh its commit or supersede it.

## Failures

If a graph call fails or the server is unavailable, carry on with the
user's task without the graph and mention once that memory was not
updated. Never claim a write succeeded without a successful tool result.
`.trim();

export const GRAPH_ADD_DESCRIPTION = 'Add a new project to the agent workflow graph. Convention: one project per workspace, named after the workspace - create the workspace project here if it does not exist yet. Project names are unique across the store';
export const GRAPH_ADD_NAME_FIELD = 'Project name';
export const GRAPH_ADD_DESCRIPTION_FIELD = 'Project description';

export const GRAPH_GET_PROJECTS_DESCRIPTION = 'List all projects in the agent workflow graph. Bootstrap lookup goes through graph-get-project by name; use this listing only to check whether the workspace project exists under a name different from the workspace folder name';

export const GRAPH_GET_PROJECT_DESCRIPTION = 'Fetch a single project from the agent workflow graph by id (24-hex ObjectId) or by exact name; provide exactly one of the two';
export const GRAPH_GET_PROJECT_ID_FIELD = 'Project id (24-hex ObjectId)';
export const GRAPH_GET_PROJECT_NAME_FIELD = 'Project name for an exact match. For session bootstrap, pass the workspace folder name: a miss means the project does not exist yet and should be created with graph-add';

export const GRAPH_DELETE_PROJECT_DESCRIPTION = 'Delete a project from the agent workflow graph by id (24-hex ObjectId)';
export const GRAPH_DELETE_PROJECT_ID_FIELD = 'Project id to delete (24-hex ObjectId)';

export const GRAPH_ADD_NODE_DESCRIPTION = 'Create a node in an existing graph for knowledge worth keeping beyond this session: a user decision or constraint, a rejected or failed approach, a non-obvious solution or discovery, or a TASK that spans several turns or may be interrupted. Search first and reuse an existing node instead of duplicating it. Nodes, edges, and memos are independent records: create edges explicitly when relationships must be preserved.';
export const GRAPH_ADD_NODE_GRAPH_ID_FIELD = 'Graph (project) id this node belongs to (24-hex ObjectId)';
export const GRAPH_ADD_NODE_TYPE_FIELD = 'Node type';
export const GRAPH_ADD_NODE_TITLE_FIELD = 'Node title: short (under 10 words) and unique within the graph, carrying the searchable tokens of the work (e.g. "invoice export finance validation"), no filler';
export const GRAPH_ADD_NODE_DESCRIPTION_FIELD = 'Node description: 1-2 short lines packing the key tokens a future search would use (problem, technologies, domain terms). Keep long detail out here - it belongs in memos';
export const GRAPH_ADD_NODE_STATUS_FIELD = 'Initial node status';
export const GRAPH_ADD_NODE_PATHS_FIELD = 'Workspace-relative files or directories this node is about (e.g. ["src/mcp/nodeTools.ts", "src/domain"]), so graph-search-nodes can find it by path. Set them when the knowledge is tied to specific code';
export const GRAPH_ADD_NODE_COMMIT_FIELD = 'Git commit SHA (7-40 hex, e.g. the output of git rev-parse --short HEAD) at which this knowledge was verified, so a later reader can check with git log <commit>..HEAD -- <paths> whether those files changed since';

export const GRAPH_APPEND_MEMO_DESCRIPTION = 'Append a memo to an existing node: one entry of the discussion recorded on the node, with the author and the type declared by the caller. Memos survive the node being completed and are exposed on the node by graph-get-node and graph-get-nodes; graph-search-nodes indexes only "resolution" and "directive" memos. Reclassify an existing memo with graph-edit-memo';
export const GRAPH_APPEND_MEMO_ID_FIELD = 'Node id to append the memo to (24-hex ObjectId)';
export const GRAPH_APPEND_MEMO_AUTHOR_FIELD = 'Speaker of this memo, not the one typing it: "agent" for the agent, "user" for a rule or clarification provided by the user, "system" for the orchestration layer';
export const GRAPH_APPEND_MEMO_TYPE_FIELD = 'Type of this memo: "note" for ephemeral working state that is not searchable, "resolution" for a confirmed answer that is searchable, "directive" for a rule future work must respect that is searchable';
export const GRAPH_APPEND_MEMO_TEXT_FIELD = 'Memo text: what was discussed, the difficulty met, or the rule that applies';

export const GRAPH_EDIT_MEMO_DESCRIPTION = 'Reclassify the type of an existing memo by id (24-hex ObjectId). The memo text and author are immutable and never change; use it to fix the type of a memo (e.g. promote a "note" that turned out to be a reusable "resolution" or a "directive")';
export const GRAPH_EDIT_MEMO_ID_FIELD = 'Memo id to reclassify (24-hex ObjectId)';
export const GRAPH_EDIT_MEMO_TYPE_FIELD = 'New memo type: "note" (not searchable), "resolution" (searchable) or "directive" (searchable)';

export const GRAPH_GET_NODES_DESCRIPTION = 'List nodes in a graph for a justified broad inspection or recovery operation. Prefer graph-search-nodes and graph-get-node for targeted retrieval. Do not use this operation as routine bootstrap or merely because a targeted search returned no results; listing the workspace rules with types ["USER_DECISION", "CONSTRAINT"] is worth it for broad or cross-cutting work. When broad inspection is necessary, apply type, status, and limit filters whenever supported. Each node comes with its description and its outgoing edges as type, targetId and targetTitle; edge descriptions and memo text are read with graph-get-node.';
export const GRAPH_GET_NODES_GRAPH_ID_FIELD = 'Graph (project) id whose nodes should be listed (24-hex ObjectId)';
export const GRAPH_GET_NODES_TYPES_FIELD = 'Only return nodes of these types (e.g. ["USER_DECISION", "CONSTRAINT"] for the workspace rules); omit for all types';
export const GRAPH_GET_NODES_STATUS_FIELD = 'Only return nodes with this status (omit for all statuses)';
export const GRAPH_GET_NODES_LIMIT_FIELD = 'Maximum number of nodes to return (omit for no limit)';

export const GRAPH_GET_NODE_DESCRIPTION = 'Fetch a single node from the agent workflow graph by id (24-hex ObjectId). Memos can be filtered by type with types (e.g. ["resolution", "directive"] to read only the reusable memory). Outgoing edges are self-describing: each edge carries the target node title';
export const GRAPH_GET_NODE_ID_FIELD = 'Node id (24-hex ObjectId)';
export const GRAPH_GET_NODE_TYPES_FIELD = 'Only return memos of these types (e.g. ["resolution", "directive"]); omit for all memos';

export const GRAPH_SEARCH_NODES_DESCRIPTION = 'Search the nodes of a graph (project) by text across title, description, and reusable memory: the node outgoing edge descriptions and memos typed "resolution" or "directive" ("note" memos are never indexed), ranked by similarity. Tokens are conjunctive (AND): a node is returned only when its searchable text (title, description, resolved/directive memos and outgoing edge descriptions combined) contains every token of the query, so more tokens make the search stricter. Pass path to keep only nodes anchored to a file or directory, alone or combined with text. Regular plurals are folded on both sides, so "instructions" matches "instruction" and "queries" matches "query". Each result of a text search exposes its combined score; a path-only search returns just the nodes, newest first. Use short meaningful tokens without articles or connectivities from any language (e.g. "calculo vale refeicao", not "calculo do vale refeicao"); a token absent from a node disqualifies it, so keep the query short or cap the result count with limit. Each hit carries the full text of the single best-matching memo of the node as bestMemo (omitted when no memo matches), and bestEdge with the description of the outgoing edge that matched when part of the query appears only in outgoing edge descriptions. The outgoing edges of a hit come as type, targetId and targetTitle; edge descriptions and the rest of the discussion are read with graph-get-node.';
export const GRAPH_SEARCH_NODES_GRAPH_ID_FIELD = 'Graph (project) id whose nodes should be searched (24-hex ObjectId)';
export const GRAPH_SEARCH_NODES_TEXT_FIELD = 'Text to match across title, description, and memories (outgoing edge descriptions) as short meaningful tokens; tokens are ANDed together, so a node is only returned when it contains every token. Optional when path is given';
export const GRAPH_SEARCH_NODES_PATH_FIELD = 'Workspace-relative file or directory: only nodes anchored to it are returned - the same path, a file inside a directory node path, or a node path inside a directory query (e.g. "src/mcp" finds nodes about src/mcp/nodeTools.ts). Combine with text to narrow further, or pass it alone to list what is known about that code';
export const GRAPH_SEARCH_NODES_LIMIT_FIELD = 'Maximum number of results to return (omit for no limit)';

export const GRAPH_UPDATE_NODE_DESCRIPTION = 'Update an existing node by id (24-hex ObjectId). Provide only the fields to change; omitted fields keep their current value. Edges are independent of nodes: updating a node never touches its edges, and node type cannot be changed.';
export const GRAPH_UPDATE_NODE_ID_FIELD = 'Node id to update (24-hex ObjectId)';
export const GRAPH_UPDATE_NODE_TITLE_FIELD = 'New node title (omit to keep current)';
export const GRAPH_UPDATE_NODE_DESCRIPTION_FIELD = 'New node description (omit to keep current)';
export const GRAPH_UPDATE_NODE_STATUS_FIELD = 'New node status (omit to keep current)';
export const GRAPH_UPDATE_NODE_PATHS_FIELD = 'New workspace-relative files or directories this node is about, replacing the current list; pass [] to clear (omit to keep current)';
export const GRAPH_UPDATE_NODE_COMMIT_FIELD = 'New git commit SHA (7-40 hex) at which this knowledge was last verified (omit to keep current)';

export const GRAPH_DELETE_NODE_DESCRIPTION = 'Delete a node from the agent workflow graph by id (24-hex ObjectId). Refuses deletion while any edge is attached to the node (incoming or outgoing), because deleting it would erase the recorded graph memory; delete those edges first with graph-delete-edge';
export const GRAPH_DELETE_NODE_ID_FIELD = 'Node id to delete (24-hex ObjectId)';

export const GRAPH_ADD_EDGE_DESCRIPTION = 'Add a first-class edge to an existing graph, from one node to another of the same graph. Edges are independent of their nodes: creating one never mutates either node. Use the description to record the memory this edge carries: how the target was resolved or the rule that applies';
export const GRAPH_ADD_EDGE_GRAPH_ID_FIELD = 'Graph (project) id this edge belongs to (24-hex ObjectId)';
export const GRAPH_ADD_EDGE_SOURCE_ID_FIELD = 'Id of the node this edge starts from';
export const GRAPH_ADD_EDGE_TARGET_ID_FIELD = 'Id of the node this edge points to';
export const GRAPH_ADD_EDGE_TYPE_FIELD = 'Edge type';
export const GRAPH_ADD_EDGE_DESCRIPTION_FIELD = 'Memory recorded on this edge: how the target was resolved or the rule that applies';

export const GRAPH_UPDATE_EDGE_DESCRIPTION = 'Update an existing edge by id. Provide only the fields to change; omitted fields keep their current value. Node fields are never touched by this tool.';
export const GRAPH_UPDATE_EDGE_ID_FIELD = 'Edge id to update (24-hex ObjectId)';
export const GRAPH_UPDATE_EDGE_TYPE_FIELD = 'New edge type (omit to keep current)';
export const GRAPH_UPDATE_EDGE_DESCRIPTION_FIELD = 'New memory recorded on this edge (omit to keep current)';

export const GRAPH_DELETE_EDGE_DESCRIPTION = 'Delete an edge by id. Refuses deletion when the edge is the only reference to its target node, because deleting it would orphan the node';
export const GRAPH_DELETE_EDGE_ID_FIELD = 'Edge id to delete (24-hex ObjectId)';

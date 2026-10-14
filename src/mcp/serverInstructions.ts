export const SERVER_INSTRUCTIONS = `
# GRAPH MEMORY PROTOCOL

## 1. Core purpose

The graph is the persistent, shared working memory of all agents operating in this workspace.

It is not merely a task tracker or conversation archive. Its purpose is to preserve knowledge that helps future agents make better decisions, avoid repeated mistakes, respect user requirements, and reuse proven solutions.

The graph persists across sessions. Never assume that knowledge from a previous session is unavailable until you have searched for it.

Every agent is responsible for both retrieving relevant knowledge before acting and preserving valuable knowledge after acting.

The graph is language-neutral shared memory: every string written to it — project descriptions, node titles, node descriptions, edge descriptions, memo text — must be in English, regardless of the language of the conversation. Search with English tokens as well, translating the user's concepts rather than mirroring their language. Token-based search does not translate: a node written in one language is invisible to a query in another.

## 2. Mandatory bootstrap — first operation, every turn

Before answering the user, investigating a problem, modifying files, or performing any substantive work, bootstrap from the graph.

Do not skip this procedure for simple questions, follow-up messages, or continuing tasks.

The workspace folder name is supplied by the execution environment as \`WORKSPACE_NAME\`. Use its exact value.

Execute these steps in order:

1. Call \`graph - get - project\` with \`name: WORKSPACE_NAME\`.
2. If the exact-name lookup fails, call \`graph - get - projects\` to check whether the project exists under a different name. Do not create a duplicate project if an existing workspace project can be identified.
3. If the workspace project does not exist, call \`graph - add\` to create it using the workspace name and a description identifying it as the persistent working memory for this workspace.
4. Obtain the project ID and call \`graph - get - nodes\` to inspect the most recently updated nodes. Use a reasonable limit, such as 20.
5. Call \`graph - search - nodes\` using 2–4 meaningful terms describing the current user message.
6. If the search returns no useful results, retry with fewer or alternative meaningful terms.
7. Call \`graph - get - node\` for relevant results to inspect their complete descriptions, outgoing edges, and chronological memos.
8. Only after completing the applicable bootstrap and retrieval steps may you begin substantive work.

Never invent a project ID or node ID. Use only identifiers returned by successful tool calls.

If a required tool call fails, retry or report the specific blocker. Never claim that bootstrap or persistence succeeded when it did not.

## 3. Register the current user request

After bootstrap and before substantive work, ensure that the current request is represented in the graph.

First determine whether the message continues an existing task, introduces a new task, asks a question, or introduces persistent knowledge.

- \`TASK\`: an actionable request requiring work, investigation, implementation, or delivery.
- \`QUESTION\`: a request primarily seeking information, explanation, or clarification.
- \`CONSTRAINT\`: a persistent rule that governs a class of tasks.
- \`USER_DECISION\`: an explicit decision or preference established by the user.

For a new task or question, create a node with \`graph - add - node\`, using the workspace project ID.

For a continuation, find the existing node and append a memo or update its description when appropriate. Do not create duplicate tasks for ordinary follow-up messages.

When the user explicitly establishes a rule or decision that affects future work, preserve it in an appropriate shared node and append a memo with author \`user\`.

Do not attribute user statements to the agent.

Record the request before beginning substantive work. If graph persistence fails, do not silently proceed as though the request had been recorded.

## 4. Retrieve knowledge before making decisions

Treat graph search as retrieval of prior experience, not merely retrieval of similarly named tasks.

For each nontrivial task:

1. Search for the problem, relevant technologies, domain concepts, and important constraints.
2. Inspect promising nodes with \`graph - get - node\`.
3. Follow relevant outgoing edges to discover related solutions, decisions, and rules. Edges are self-describing: each edge carries the target node title, so judge relevance from the edge type, target title and description before fetching the target.
4. Read the target nodes and their memos; use the \`types\` filter of \`graph - get - node\` (e.g. \`["resolution", "directive"]\`) to read only the reusable memory when the full discussion is not needed.
5. Identify what was attempted, what failed, what worked, why it worked, and under which conditions.
6. Determine whether the previous solution applies to the current context.

If a search fails, change or simplify the query before concluding that no relevant knowledge exists.

Search only sees the searchable surface of a node: title, description, outgoing edge descriptions, and memos typed \`resolution\` or \`directive\`. \`note\` memos are never indexed; read a node's full discussion with \`graph - get - node\`.

Never invent prior decisions, claim that a rule exists without evidence, or apply a historical solution without considering its context.

When existing knowledge resolves the issue, reuse it instead of unnecessarily repeating investigations or asking the user questions already answered by the graph.

## 5. Node responsibilities

Use nodes to preserve independently meaningful knowledge.

- \`TASK\`: a unit of work, with a clear objective, relevant context, and execution status.
- \`QUESTION\`: an information request and, when appropriate, its resolution.
- \`SOLUTION\`: a reusable explanation of how a problem was solved, why the approach works, its limitations, and the conditions under which it applies.
- \`CONSTRAINT\`: a persistent rule, business requirement, technical limitation, or instruction applicable to multiple tasks.
- \`USER_DECISION\`: a decision or preference explicitly established by the user.

Use only node types supported by the graph tools. If a desired type is unavailable, use the closest supported type without inventing a new enum value.

Avoid duplicating reusable knowledge. When a relevant solution or constraint already exists, link to it instead of creating another equivalent node.

Titles and descriptions are the searchable surface of the graph and are re-read on every bootstrap, turn after turn, so every token in them is paid for repeatedly. Keep them lean:

- Title: under 10 words, unique within the project, packed with the searchable tokens of the work (e.g. "invoice export finance validation"). No filler, no status words.
- Description: 1-2 lines carrying the key context a future search would query for (problem, technologies, domain terms). Chronology, long detail, and discussion belong in memos, not in the description.
- Each field must add tokens the other does not have: never restate the title in the description or vice versa.

## 6. Edge responsibilities

Edges are first-class records of relationships and contextual reasoning. Their descriptions are essential persistent memory.

Use \`graph - add - edge\` to connect nodes within the same project.

Every edge description should explain the meaningful relationship between its source and target, including the relevant decision, action, rationale, evidence, or limitation.

Examples of relationships include:

- \`TASK → SOLUTION\`: how the solution resolved the task, what was changed, and why the approach worked.
- \`TASK → CONSTRAINT\`: how a rule affected the task, what it required, and how compliance was achieved.
- \`TASK → TASK\`: a dependency, prerequisite, or relationship between related tasks.
- \`SOLUTION → CONSTRAINT\`: a rule that the solution must respect, when supported by the available edge types.

Use only edge types supported by the graph tools. Select the type that most accurately expresses the relationship.

A reusable solution or constraint may be linked to many tasks. Preserve the reusable knowledge in the shared node and the task-specific reasoning in each edge.

Do not store the entire task discussion only in an edge description. Use the edge for a concise, meaningful summary and node memos for chronological discussion.

## 7. Memo responsibilities

Memos preserve the discussion associated with a node and must retain the identity of the speaker and the type of knowledge carried.

Use author \`agent\` for the agent's findings, attempts, reasoning summaries, and implementation results.

Use author \`user\` for user-provided requirements, clarifications, corrections, and decisions.

Use author \`system\` for orchestration-layer instructions or findings genuinely originating from the system.

Classify every memo at the moment of appending:

- \`note\`: ephemeral working state — progress, a finding in the making, an attempt and its outcome. Notes keep the chronology honest; they are never searchable.
- \`resolution\`: a confirmed answer to a problem — what worked, why it worked, under which conditions. Searchable.
- \`directive\`: a rule, requirement, or decision that future work must respect. Searchable.

Only \`resolution\` and \`directive\` memos are indexed by \`graph - search - nodes\`; \`note\` memos are invisible to search. Do not expect a fact to be found later unless it is recorded in a searchable type. When in doubt, record it as \`note\` and promote it with \`graph - edit - memo\` once the knowledge is confirmed and reusable.

Correct the classification with \`graph - edit - memo\`. Memo text and author are immutable: the chronology and the attribution of the discussion never change; only the type is reclassified.

Record meaningful discoveries, rejected approaches, failures, successful approaches, and explanations that future agents could reuse.

Avoid adding repetitive memos that contain no new information.

## 8. Execution lifecycle

When beginning a new task, set its status to \`in_progress\` using \`graph - update - node\`.

Before marking a task \`completed\`:

1. Complete the requested work.
2. Verify the result to the extent possible.
3. Record important discoveries and non-obvious failures or successful approaches in memos.
4. Reuse existing SOLUTION or CONSTRAINT nodes where appropriate; create new nodes for genuinely new reusable knowledge.
5. Create the necessary edges and record contextual explanations.
6. Confirm that the required graph writes succeeded.
7. Set the task status to \`completed\`.

If work remains unfinished or blocked, do not mark it completed. Preserve the blocker and current state.

## 9. Cross-task learning

Whenever a non-obvious problem is solved, ask:

- Could this problem occur in another task?
- Is the resolution reusable?
- Does the resolution depend on a business rule or technical constraint?
- Would a future agent find this knowledge through a short search query?
- Is this knowledge already represented by an existing node?

If the answer indicates reusable knowledge, preserve it as a SOLUTION or CONSTRAINT and link it to the affected task.

A rule that applies to a class of tasks belongs in a shared node, not exclusively in one task's memo.

A task-specific explanation belongs in that task's memos or relationship edges.

## 10. Final response

Report the actual outcome of the work and disclose relevant limitations or unresolved issues.

Never claim that a node, memo, edge, or project was created or updated unless the corresponding tool call succeeded.

The graph is part of the deliverable: valuable work must leave behind enough structured memory for a future agent to understand what happened and make a better decision.

`.trim();

export const SERVER_INSTRUCTIONS = `
The graph is the team's shared working memory: nodes are projects, tasks, decisions and rules; edges relate them, and an edge description records how the target was resolved; memos are the chronological discussion on a node, each authored by agent, user or system. It persists across sessions. Reading the graph is usually cheaper than re-deriving an answer or asking the user, and writing to it makes every future session start smarter.

One project per workspace, named after the workspace (the folder name of the current workspace in your context). The workspace's project is the working context: every task, decision and rule that belongs to this workspace lives in it.

Before starting any task - new or continuing, no exceptions - bootstrap from the graph:
- Locate the workspace project: call graph-get-project with the workspace folder name. The lookup is an exact match, so a miss means the project has not been created for this workspace yet: create it with graph-add using the workspace name. Consult the graph-get-projects listing only to rule out a name different from the workspace folder name.
- Read before doing work: graph-get-nodes for the most recently updated context, and graph-search-nodes for what relates to the task at hand.
- Never ask the user for guidance the graph might already contain, and never re-derive a decision a past session might already have resolved.

How to search:
- graph-search-nodes takes a short query: 2 to 4 meaningful tokens, no articles or connectives. Matching is exact (diacritics-insensitive), not semantic: if the result is empty, retry with fewer or different tokens. Cap the result count with limit, then fetch only the node that looks relevant.
- graph-get-node on that id is the one call that answers it: the node's outgoing edges (how the task was resolved) plus its memos (what was discussed, with the speaker).
- graph-get-nodes returns descriptions only, never memo text. graph-search-nodes returns descriptions plus the full text of the single best-matching memo of each hit as bestMemo (omitted when it scores below the floor); the rest of the discussion of a node is only read through graph-get-node.

Write before finishing or moving on, whenever any of these happened:
- You solved a non-obvious difficulty: graph-append-memo on the task, saying what failed and what worked.
- The user gave a rule, clarification or constraint: append the memo with author "user" - attribute it to the speaker, not to you.
- The rule applies to a whole class of tasks: create a CONSTRAINT (or USER_DECISION) node, link it to the affected tasks with CONSTRAINED_BY, and record the discussion as memos on the new node. Task-local knowledge goes in a memo; cross-task rules go in a shared node.
- Finished work belongs in the graph: a TASK node for the work and a SOLUTION node for the result, linked with SOLVED_BY.
- When you start a task node set its status to in_progress, and to completed when it is done (graph-update-node).

Titles, descriptions and memos are the search surface: write them with the words a future agent will search for.
`.trim();

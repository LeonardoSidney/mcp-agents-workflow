export const SERVER_INSTRUCTIONS = `
The graph is the team's shared working memory: nodes are projects, tasks, decisions and rules; edges relate them, and an edge description records how the target was resolved; memos are the chronological discussion on a node, each authored by agent, user or system. It persists across sessions. Reading the graph is usually cheaper than re-deriving an answer or asking the user, and writing to it makes every future session start smarter.

Read before starting - or re-approaching - a task that sounds known, and before asking the user for guidance that might already be recorded:
- graph-search-nodes takes a short query: 2 to 4 meaningful tokens, no articles or connectives. Matching is exact (diacritics-insensitive), not semantic: if the result is empty, retry with fewer or different tokens. Cap the result count with limit, then fetch only the node that looks relevant.
- graph-get-node on that id is the one call that answers it: the node's outgoing edges (how the task was resolved) plus its memos (what was discussed, with the speaker).

Write before moving on, whenever any of these happened:
- You solved a non-obvious difficulty: graph-append-memo on the task, saying what failed and what worked.
- The user gave a rule, clarification or constraint: append the memo with author "user" - attribute it to the speaker, not to you.
- The rule applies to a whole class of tasks: create a CONSTRAINT (or USER_DECISION) node, link it to the affected tasks with CONSTRAINED_BY, and record the discussion as memos on the new node. Task-local knowledge goes in a memo; cross-task rules go in a shared node.
- When you start a task node set it to in_progress, and to completed when it is done (graph-update-node).

Titles, descriptions and memos are the search surface: write them with the words a future agent will search for.
`.trim();

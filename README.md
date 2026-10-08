# mcp-agents-workflow

> A self-hosted **Model Context Protocol (MCP) server** that gives AI agents a persistent working memory — a shared, durable graph of relevant notes about a piece of work: the decisions it took, the solutions it reached, the rules it was given, the dead ends it hit, and the discussions that produced them all.
>
> Every new session or subagent reads what was already worked out and writes back what it learned. Solutions are recalled instead of re-derived, discussions continue across sessions and agents instead of restarting, and compute goes into new decisions and new work — not into repeating reasoning that already happened.

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-blue?logo=typescript&logoColor=white" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-24-3c873a?logo=node.js&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white" />
  <img alt="MCP" src="https://img.shields.io/badge/MCP-stdio%7CHTTP-8A63D2" />
  <img alt="Jest" src="https://img.shields.io/badge/Jest-29-9932CC?logo=jest&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-AGPL--3.0-blue" />
</p>

---

## Table of Contents

- [What it's good for](#what-its-good-for)
- [How it works](#how-it-works)
  - [Projects](#projects)
  - [Nodes](#nodes)
  - [Edges](#edges)
  - [Memos](#memos)
- [Available tools](#available-tools)
- [How the agent adopts it](#how-the-agent-adopts-it)
- [Setup](#setup)
  - [Option 1 — Docker Compose (recommended)](#option-1--docker-compose-recommended)
  - [Option 2 — Local (Node.js + MongoDB)](#option-2--local-nodejs--mongodb)
  - [Connecting your MCP client](#connecting-your-mcp-client)
  - [Environment variables](#environment-variables)
- [Testing](#testing)
- [⚠️ Disclaimer](#️-disclaimer)

---

## What it's good for

The tagline above is the short version. In practice, pointing your agents at this server gets them:

- **Recall instead of re-derivation.** Before starting a task, the agent searches the graph for related work — decisions already made, solutions already found, rules already given, constraints already known. A few cheap reads beat re-running the same reasoning or asking the user for an answer that is already on record.
- **Discussions that continue across sessions and subagents.** Every node carries an attributed, chronological discussion: what was talked through, what got difficult, who said what (`agent`, `user`, `system`). A new session, a subagent or a teammate picks the thread up exactly where it was left — nobody restarts a conversation that already happened.
- **No dead end walked twice.** Failed approaches are recorded as first-class citizens (`ATTEMPT`, `FAILURE`, `REJECTED_APPROACH`), superseded decisions are linked to what replaced them (`SUPERSEDES`), and current constraints stay attached to the node they rule. A reader sees not just where the work landed but every road that didn't get there.
- **Less cost per decision.** Compute and the user's attention go to genuinely new problems: the agent doesn't re-read the codebase to recover a decision, doesn't re-test an approach that already failed, and doesn't re-ask a question that was already answered.
- **One source of truth, shared by name.** The graph lives in MongoDB and is addressed by workspace name. The next session, another client, a subagent, another machine or a teammate pointed at the same database all land on the same project — and everything anyone writes, everyone else inherits.
- **It adopts itself.** The server sends rich instructions to the MCP client at session start: how to find or create this workspace's project, when to read, what to write back. No per-repo setup, no prompt injection — a model that has never seen the graph follows the workflow on first contact.

Underneath all of this it is a _typed_ knowledge graph rather than a generic note store: every fact declares what kind of fact it is (`HYPOTHESIS`, `FACT`, `SOLUTION`, `CONSTRAINT`…) and how it relates to other facts (`SOLVED_BY`, `DERIVED_FROM`, `CONSTRAINED_BY`…) — which is what makes the recall above precise instead of fuzzy.

## How it works

The memory model is a directed graph with four levels of structure. Everything inside a project graph is independent: creating an edge never mutates its nodes, and deleting a node is refused while edges still attach to it — the recorded graph memory is never silently erased.

### Projects

A **project** is the root container for all knowledge about one piece of work. Each project is itself a graph with its own nodes, edges and memos.

### Nodes

A **node** is one unit of knowledge or work. Nodes come in 22 typed flavors, including:

| Category      | Types                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| **Work**      | `PROJECT`, `GOAL`, `REQUIREMENT`, `TASK`, `SUBTASK`, `AGENT`                            |
| **Knowledge** | `OBSERVATION`, `FACT`, `HYPOTHESIS`, `DISCOVERY`, `ARTIFACT`, `COMPONENT`, `DEPENDENCY` |
| **Decisions** | `USER_DECISION`, `AGENT_DECISION`, `CONSTRAINT`, `QUESTION`, `CONFLICT`                 |
| **Outcomes**  | `ATTEMPT`, `FAILURE`, `SOLUTION`, `REJECTED_APPROACH`                                   |

Each node has a type, title, description and a lifecycle status (`pending` → `in_progress` → `in_validation` → `completed`): work moves through validation before it counts as done. A node's type is immutable after creation; its title, description and status can be updated.

### Edges

An **edge** is a typed, first-class relationship between two nodes of the same graph — and the place where _how_ something was resolved is recorded in its description. There are 23 edge types covering structure (`CONTAINS`, `PART_OF`), causality (`DERIVED_FROM`, `AFFECTS`), resolution (`SOLVED_BY`, `ANSWERS`, `VALIDATES`, `INVALIDATES`), attribution (`CREATED_BY`, `ASSIGNED_TO`, `DISCOVERED_BY`), and decision flow (`SUPERSEDES`, `REJECTED`, `CONSTRAINED_BY`, `CONFLICTS_WITH`, `USER_VALIDATE`, …).

### Memos

A **memo** is one entry in the chronological discussion _on a node_ — what was discussed, the difficulty met, or the rule that applies. Memos are:

- **Append-only** and survive the node being completed;
- **Attributed**: each memo declares its speaker — `agent`, `user` (a rule or clarification provided by the human) or `system` (the orchestration layer) — so a future reader can tell what was decided by whom;
- **Searchable**: node search matches across titles, descriptions, attached-edge memories _and_ memos, ranked by match score.

Together, nodes (what), edges (how it connects / how it was resolved) and memos (what was discussed) form the shared working memory of the team.

## Available tools

The server exposes **14 tools** across three toolsets:

| Tool                   | Description                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `graph-add`            | Create a new project graph                                                                                      |
| `graph-get-projects`   | List all projects in the graph store                                                                            |
| `graph-get-project`    | Fetch a single project by id (uuidv4)                                                                           |
| `graph-delete-project` | Delete a project by id                                                                                          |
| `graph-add-node`       | Add a typed node to an existing project graph                                                                   |
| `graph-get-nodes`      | List a project's nodes (descriptions only, no memo text; filter by type/status, cap with `limit`, newest first) |
| `graph-get-node`       | Fetch a node by id, including its outgoing edges and memos                                                      |
| `graph-update-node`    | Partially update a node's title, description or status                                                          |
| `graph-delete-node`    | Delete a node (refused while edges are still attached)                                                          |
| `graph-search-nodes`   | Exact token search (not semantic, diacritics-insensitive) across titles, descriptions, edge memories and memos  |
| `graph-append-memo`    | Append an attributed discussion entry to a node                                                                 |
| `graph-add-edge`       | Add a typed, first-class edge between two nodes, with a memory in its description                               |
| `graph-update-edge`    | Partially update an edge's type or description                                                                  |
| `graph-delete-edge`    | Delete an edge by id (never touches its nodes)                                                                  |

On top of the tools, the server sends rich **instructions** to the MCP client at session start: the session bootstrap (locate or create the workspace project), the read-then-write workflow, query phrasing for `graph-search-nodes`, and how to attribute memos — so even a model that has never seen the graph behaves sensibly with it.

## How the agent adopts it

No per-workspace setup is needed. The convention is **one project per workspace, named after the workspace**, and the server instructions make the first session self-bootstrap:

1. The agent calls `graph-get-projects` to locate the project named after the current workspace — creating it with `graph-add` when it does not exist yet.
2. It reads the context (`graph-get-nodes`, `graph-search-nodes`) before working — picking up decisions, rules and resolutions recorded by past sessions.
3. Before finishing, it writes back: finished work (`TASK` → `SOLUTION`), user rules (memos attributed to `user`), and lessons learned.

Onboarding a new repository therefore ends with the [Setup](#setup) above: point the client at the server, and the first agent session builds the memory. Every later session — even on another machine, or from a teammate who shares the same database — inherits it, re-deriving the workspace project by name.

## Setup

### Option 1 — Docker Compose (recommended)

Requires [Docker](https://docs.docker.com/get-docker/).

```bash
git clone https://github.com/LeonardoSidney/mcp-agents-workflow.git
cd mcp-agents-workflow
docker compose up --build
```

This starts two services:

| Service | What it is                                                                | Ports                                                                |
| ------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `app`   | The MCP server (Node 24, watch mode with `./src` mounted for live reload) | `4000` → Streamable HTTP MCP endpoint at `http://localhost:4000/mcp` |
| `mongo` | MongoDB 8 with a healthcheck and a persistent `mongo-data` volume         | `27017`                                                              |

The app waits for Mongo to be healthy before starting, so no manual sequencing is needed. Stop everything with `docker compose down` (add `-v` to also wipe the database volume).

### Option 2 — Local (Node.js + MongoDB)

Requires **Node.js 24+** and a running **MongoDB** instance (localhost default).

```bash
git clone https://github.com/LeonardoSidney/mcp-agents-workflow.git
cd mcp-agents-workflow
npm ci

# Stdio transport (spawns per client, typical MCP setup)
npm run dev          # runs: tsx watch src/index.ts

# Or, HTTP transport (long-running server on port 3000)
MONGODB_URI=mongodb://127.0.0.1:27017/mcp-agents-workflow npx tsx src/server.ts
```

### Connecting your MCP client

There are two transports — pick the one that fits where the server runs.

**Option A — http (the server runs standalone, recommended)**

Use this when you went with Docker Compose, a remote host, or multiple clients sharing one server and one database. The repository ships a ready-to-use [`.mcp.json`](.mcp.json) with this entry (see [`.mcp.http.example.json`](.mcp.http.example.json)):

```json
{
  "mcpServers": {
    "mcp-agents-workflow": {
      "type": "http",
      "url": "http://localhost:4000/mcp"
    }
  }
}
```

**Option B — stdio (the client spawns the server itself)**

Use this for local development, where your MCP client runs the server per client. See [`.mcp.stdio.example.json`](.mcp.stdio.example.json):

```json
{
  "mcpServers": {
    "mcp-agents-workflow": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "env": {
        "MONGODB_URI": "mongodb://127.0.0.1:27017/mcp-agents-workflow"
      }
    }
  }
}
```

Any MCP-compatible client works (Claude Desktop, VS Code Copilot, Cursor, or programmatic clients based on the official `@modelcontextprotocol/client` SDK).

### Environment variables

| Variable      | Default                                         | Description                                                                |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mcp-agents-workflow` | MongoDB connection string                                                  |
| `PORT`        | `3000`                                          | HTTP port for the Streamable HTTP transport (only used by `src/server.ts`) |

## Testing

The project ships unit and API test suites (Jest).

```bash
npm test              # unit tests
npm run test:api      # API tests (exercise the full MCP surface through a real client)
npm run test:coverage # unit tests with coverage report
```

---

## ⚠️ Disclaimer

This project is **tested and optimized** to work with
[**Qwen3.8-27B-GGUF**](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF)
(`Qwen3.8-27B-UD-Q4_K_XL.gguf`) as the driving model for the agents.

Tool schemas, descriptions and server instructions were tuned for that model's context and reasoning profile. It will work with other MCP-compatible models, but behavior is **not** guaranteed or optimized for models other than the one above — in particular, smaller models may not follow the graph-usage workflow described in the server instructions reliably.

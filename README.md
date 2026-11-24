# `neuron-engine`

**Local-first 3-tier cognitive memory engine (Progressive Non-Linear Context Graph / hybrid RAG) for AI coding agents.**

Compatible with **Claude Code**, **OpenAI Codex CLI**, **`pi` coding agent**, **Antigravity (`agy`)**, and any terminal-capable agent harness.

---

## Problem

Long-horizon engineering sessions with LLM coding agents fail in predictable ways:

1. **Context rot & compaction loss:** Linear chat transcripts accumulate stale tool output and lose architectural decisions across compactions and session restarts.
2. **Topic entanglement:** Real engineering work is non-linear—switching between a production incident, a refactor, and a schema migration inside one linear thread pollutes prompt context.
3. **Opaque, vendor-locked memory:** Hosted memory services hide state behind proprietary APIs, making it impossible to inspect, diff, version, or correct what an agent believes.

`neuron-engine` solves this with a local, zero-token-cost CLI and plain-file memory graph stored directly in `./.memory/`.

---

## Architecture: 3-Tier Cognitive Memory Hierarchy

```text
+-------------------------------------------------------------------------+
|  L1: Working Consciousness (Active Prompt Focus)                        |
|  - Active topic pointer (`neuron remember <topic>`)                     |
|  - Loaded on session start via `neuron awake`                           |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|  L2: Non-Linear Context Graph  (./.memory/memories.json)                |
|  - Topic nodes with active/archived state & condensed summaries         |
|  - Exact file/line fragment pointers into L3 logs (`neuron synapsis`)   |
|  - Consolidated locally with zero LLM calls (`neuron dream`)            |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|  L3: Episodic Storage & Hybrid RAG  (./.memory/logs/ & MEMORY.md)       |
|  - Append-only daily Markdown logs (`YYYY-MM-DD.md`)                    |
|  - Passive lifecycle auto-logging (`bin/auto-log.js` for Claude / agy)  |
|  - Executive Dashboard (`MEMORY.md`, capped <500 lines)                 |
|  - Hybrid BM25 + vector search via `qmd` (graceful text fallback)       |
+-------------------------------------------------------------------------+
```

### Design Principles
- **Zero-LLM state management:** `awake`, `remember`, `synapsis`, `dream`, and `forget` execute locally in <15ms without spending model tokens.
- **100% local & auditable:** All state lives in plain JSON and Markdown inside `./.memory/`. Any incorrect memory can be edited or deleted directly in your editor.
- **Harness-agnostic CLI:** Works natively across Claude Code, OpenAI Codex CLI, `pi`, Antigravity, or any shell-enabled agent.
- **Graceful degradation:** Uses `qmd` for hybrid vector + BM25 search when installed, and automatically falls back to local graph + log search when absent.

---

## Installation

### 1. Install the `neuron` CLI (Standalone — Works Everywhere)
```bash
git clone https://github.com/mannysz/neuron-engine.git ~/.local/share/neuron-engine
chmod +x ~/.local/share/neuron-engine/bin/neuron ~/.local/share/neuron-engine/bin/neuron.js ~/.local/share/neuron-engine/bin/auto-log.js
mkdir -p ~/.local/bin
ln -sf ~/.local/share/neuron-engine/bin/neuron ~/.local/bin/neuron
```
Ensure `~/.local/bin` is on your `PATH`, then verify:
```bash
neuron help
```

### 2. Optional: Semantic Vector Search (`qmd`)
For hybrid vector + BM25 recall over `.memory/logs/*.md`, install [`qmd`](https://github.com/tobi/qmd). Without `qmd`, `neuron search` gracefully falls back to L2 graph + local log matching.

---

## Agent Harness Integrations

### Claude Code
1. Copy the protocol snippet from [`integrations/claude-code/CLAUDE.md`](integrations/claude-code/CLAUDE.md) into your project's `CLAUDE.md` (or `~/.claude/CLAUDE.md`).
2. *(Optional)* Enable passive episodic logging on every turn by adding the `Stop` hook from [`integrations/claude-code/settings.json`](integrations/claude-code/settings.json) to `.claude/settings.json` (pointing to your local `bin/auto-log.js`). `auto-log.js` natively parses Claude Code's `cwd` and `transcript_path` JSONL format.

### OpenAI Codex CLI
Copy the protocol snippet from [`integrations/codex/AGENTS.md`](integrations/codex/AGENTS.md) into your repository's `AGENTS.md`. Codex CLI executes `neuron awake`, `neuron remember`, `neuron synapsis`, and `neuron search` directly through its shell tool.

### `pi` Coding Agent
Install directly as a `pi` package (bundles the `extensions/neuron-pi.ts` lifecycle extension and `skills/neuron-engine` skill):
```bash
pi install git:github.com/mannysz/neuron-engine
```

### Antigravity (`agy`)
Install as a global plugin (auto-registers `hooks.json`, `skills/neuron-engine`, and `rules/neuron-engine.md`):
```bash
agy plugin install https://github.com/mannysz/neuron-engine
```
In the `agy` chat prompt, you can also invoke `neuron` directly with zero LLM tokens using `!`:
```bash
!neuron awake
!neuron remember auth-refactor
!neuron list
```

---

## CLI Reference

```bash
# Hydrate active L1 focus, L2 context graph, recent daily log tail, and MEMORY.md
neuron awake

# Switch or initialize an active L1 memory workstream
neuron remember <topic>

# Record a structured milestone fragment (Wanted | Done | Result)
neuron synapsis --summary "Wanted: Rotate JWT keys | Done: Added JWKS cache | Result: All 24 auth tests pass"

# Condense recent fragments into L2 summaries and refresh qmd vector index
neuron dream

# Offload a completed topic from active L1 focus (preserved in L2/L3)
neuron forget <topic>

# Hybrid L2 graph + vector/log search
neuron search "<query>"

# List all active and archived memory nodes
neuron list

# Inspect raw JSON for a single memory node
neuron show <topic>
```

---

## Testing

Zero external test dependencies—uses Node's built-in test runner (`node --test`):

```bash
npm test
```

Covers the full L1/L2/L3 CLI lifecycle (`test/neuron-cli.test.mjs`), Claude Code and Antigravity JSONL passive auto-log hooks, and the `pi` coding agent extension (`test/neuron-pi.test.mjs`).

---

## License

MIT

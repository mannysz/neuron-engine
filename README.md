# neuron-engine

A local-first persistent memory CLI for AI coding agents. It works with **Claude Code**, **OpenAI Codex CLI**, **`pi`**, **Antigravity (`agy`)**, or any agent that can run shell commands.

## What it is

AI coding agents lose track of architecture decisions, debugging history, and project conventions whenever a chat compacts or a new session starts. `neuron-engine` fixes that by storing your project's memory locally in plain Markdown and JSON inside `.memory/`.

There is no cloud service, no database to run, and no extra LLM tokens spent managing state. Everything runs locally in under 15ms and can be read or edited in your text editor.

## How it works

Memory is organized into three simple layers inside `./.memory/`:

1. **Active Focus (`L1`)** — Tracks the topic you are working on right now (`neuron remember <topic>`). On session start, `neuron awake` prints your active focus, recent log tail, and project summary so the agent resumes immediately.
2. **Topic Graph (`L2` — `.memory/memories.json`)** — Stores each workstream as a node with a short summary and pointers to specific line ranges in your logs. Switching topics keeps unrelated tasks from cluttering the prompt.
3. **Daily Logs & Search (`L3` — `.memory/logs/YYYY-MM-DD.md` & `.memory/MEMORY.md`)** — Append-only daily logs plus a short project dashboard (`MEMORY.md`). Optional [`qmd`](https://github.com/tobi/qmd) integration adds hybrid vector + keyword search; without it, `neuron search` falls back to local text search.

## Install

### 1. Install the CLI

```bash
git clone https://github.com/mannysz/neuron-engine.git ~/.local/share/neuron-engine
mkdir -p ~/.local/bin
ln -sf ~/.local/share/neuron-engine/bin/neuron ~/.local/bin/neuron
```

Make sure `~/.local/bin` is in your `PATH`, then run `neuron help` to verify.

### 2. Connect your coding agent

* **Claude Code:** Copy [`integrations/claude-code/CLAUDE.md`](integrations/claude-code/CLAUDE.md) into your `CLAUDE.md`. To log turns automatically, add the `Stop` hook from [`integrations/claude-code/settings.json`](integrations/claude-code/settings.json) to `.claude/settings.json`.
* **OpenAI Codex CLI:** Copy [`integrations/codex/AGENTS.md`](integrations/codex/AGENTS.md) into your repository's `AGENTS.md`.
* **`pi` Coding Agent:** Run `pi install git:github.com/mannysz/neuron-engine`.
* **Antigravity (`agy`):** Run `agy plugin install https://github.com/mannysz/neuron-engine`.

## Basic commands

| Command | What it does |
| :--- | :--- |
| `neuron awake` | Load active focus, recent logs, and `MEMORY.md` at session start |
| `neuron remember <topic>` | Focus memory on a specific feature or workstream |
| `neuron synapsis --summary "..."` | Save a milestone note (`Wanted \| Done \| Result`) to the active topic |
| `neuron search "<query>"` | Search topic summaries and daily logs (uses `qmd` if installed) |
| `neuron dream` | Condense recent notes into topic summaries and refresh the index |
| `neuron forget <topic>` | Archive a finished topic out of active focus |
| `neuron list` / `neuron show <topic>` | Inspect all topics or view a single node's JSON |

## Contributing

Contributions are welcome. Keep changes small, dependency-free, and covered by tests.

1. Fork the repo and create a branch (`git checkout -b fix/your-change`).
2. Run the built-in Node test suite (no external packages required):
   ```bash
   npm test
   ```
3. Open a pull request with a short description of what changed and why.

## License

MIT

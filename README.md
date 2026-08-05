# `neuron-engine` 🧠⚡
> Progressive Non-Linear Context Graph (PNG-RAG) Memory Engine for AI Coding Agents

`neuron-engine` is a high-performance, 3-tier persistent memory engine designed for AI coding agents (such as Google Antigravity, Claude Code, Codex, and AGY CLI). 

It prevents context degradation over long coding sessions by maintaining a non-linear graph of memories, daily episodic logs, and local vector RAG.

---

## 🏛️ 3-Tier Cognitive Memory Hierarchy

1. **L1 (Working Consciousness)**: Active memory focus (`neuron remember <topic>`), keeping high-priority context in the agent's immediate focus.
2. **L2 (Non-Linear Context Graph)**: Structured `./.memory/memories.json` tracking active topics, condensed summary nodes, and exact line fragment pointers into daily logs.
3. **L3 (Episodic Storage & RAG)**: Append-only Markdown daily logs (`./.memory/logs/YYYY-MM-DD.md`), an Executive Dashboard (`./.memory/MEMORY.md`), and hybrid QMD vector/BM25 search embeddings.

---

## 📦 Installation

### Global Antigravity Plugin
Clone or copy into your global Antigravity plugins directory:
```bash
mkdir -p ~/.gemini/config/plugins
cp -r neuron-engine ~/.gemini/config/plugins/neuron-engine
```

### Local Workspace Plugin
Copy into your project's `.plugins/` folder:
```bash
cp -r neuron-engine ./.plugins/neuron-engine
```

---

## 🚀 CLI Usage & Commands

```bash
# Ingest active L1 memories, daily log tail, and Executive Dashboard
neuron awake

# Focus active memory on a specific feature or workstream
neuron remember feature-auth

# Record a completed work fragment using the 3-part formula
neuron synapsis --summary "Wanted: Implement OAuth2 login | Done: Added JWT verification & routes | Result: Auth tests passing"

# Condense fragment summaries into L2 context nodes and re-index vector embeddings
neuron dream

# Offload a completed feature from active L1 focus
neuron forget feature-auth

# Perform hybrid vector & BM25 search over memory logs
neuron search "OAuth token secret"

# List all active/archived memory nodes
neuron list

# Inspect exact JSON structure for a specific memory node
neuron show feature-auth
```

---

## ⚡ Automatic Session Hook (`hooks.json`)

`neuron-engine` automatically hooks into agent lifecycle events (`PostInvocation` and `Stop`) to extract user requests, tools used, and modified files into daily episodic logs without manual effort.

---

## 📄 License
MIT License. Free for open source and commercial use.

# `neuron-engine` 🧠⚡
> Progressive Non-Linear Context Graph (PNG-RAG) Memory Engine for AI Coding Agents

`neuron-engine` is a high-performance, persistent memory engine designed for AI coding agents like Google Antigravity. 

It solves a fundamental problem: **context degradation over long coding sessions**. By maintaining a non-linear graph of memories, daily episodic logs, and local vector RAG, it ensures your AI agent never "forgets" architectural decisions, past bugs, or user preferences, no matter how long the project runs.

---

## 🌟 Why Use `neuron-engine`?

* **Eliminate Context Bloat**: Stop paying API costs for an AI that has to scan hundreds of pages of past chat transcripts. `neuron-engine` isolates exactly what the agent needs via semantic RAG, keeping prompts lightning fast and hyper-focused.
* **Instant Session Resumption**: Never waste the first 5 minutes of a new session explaining your architecture, your tech stack, or where you left off. The agent wakes up already knowing.
* **100% Local & No Vendor Lock-In**: Your agent's brain isn't trapped in a proprietary cloud database. Every memory, rule, and log is stored as plain Markdown and JSON directly inside your local `.memory/` folder.
* **Auditable & Editable**: If the AI hallucinates a memory or learns a bad habit, you can literally open `.memory/memories.json` in your code editor and delete it. You have total sovereign control over its knowledge graph.
* **Passive Auto-Logging**: You don't have to constantly command the AI to "remember this." The engine automatically hooks into the agent's lifecycle, quietly logging your prompts and file edits in the background as you code.

---

## 📦 Prerequisites & Installation

### Prerequisite: `qmd`
For the semantic vector search to function correctly, `neuron-engine` requires the `qmd` CLI binary to be installed on your system.
```bash
# Example (if qmd is available via homebrew, adjust to your actual qmd installation method)
brew install qmd
```
*(Note: If `qmd` is missing, the engine will gracefully degrade to basic text search, but semantic recall will be heavily impaired).*

### 1. Via Antigravity CLI (Recommended)
You can install this plugin globally directly from GitHub:
```bash
agy plugin install https://github.com/mannysz/neuron-engine
```

### 2. Manual Global Install
Clone directly into your global Antigravity plugins directory:
```bash
git clone https://github.com/mannysz/neuron-engine ~/.gemini/config/plugins/neuron-engine
```

### 3. Local Workspace Install
Copy into your project's `.plugins/` folder to keep it isolated to one repository:
```bash
git clone https://github.com/mannysz/neuron-engine ./.plugins/neuron-engine
```

---

## 🏛️ How It Works: Internals

`neuron-engine` manages memory across a **3-Tier Cognitive Hierarchy**:

1. **L1 (Working Consciousness)**: Active memory focus (set via `neuron remember <topic>`). This keeps the highest-priority context in the agent's immediate focus window.
2. **L2 (Non-Linear Context Graph)**: A structured `./.memory/memories.json` file. It tracks active topics, creates condensed summary nodes, and holds exact line fragment pointers into your daily logs.
3. **L3 (Episodic Storage & RAG)**: Append-only Markdown daily logs (`./.memory/logs/YYYY-MM-DD.md`), an Executive Dashboard (`./.memory/MEMORY.md`), and hybrid QMD vector/BM25 search embeddings.

**Automatic Session Hook (`hooks.json`)**: 
The plugin automatically binds to the agent's lifecycle events (`PostInvocation` and `Stop`). It silently extracts the user's prompts, the tools executed, and the files modified, writing them into the daily episodic logs without manual effort.

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

## 📄 License
MIT License. Free for open source and commercial use.

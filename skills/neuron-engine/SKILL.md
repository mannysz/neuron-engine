---
name: neuron-engine
description: Progressive Non-Linear Context Graph (PNG-RAG) memory engine for AI coding agents.
---

# Neuron Engine Skill

`neuron-engine` manages persistent non-linear context graph memory across sessions using a 3-tier cognitive hierarchy:
* **L1 (Working Consciousness)**: Active memory focus (`neuron remember <name>`), real-time turn context.
* **L2 (Context Graph - JSON)**: `./.memory/memories.json` storing active memories, condensed L2 summaries, and fragment pointers.
* **L3 (Episodic Storage & RAG)**: `./.memory/logs/*.md` daily log files, QMD vector embeddings, and `./.memory/MEMORY.md` Executive Dashboard.

---

## When to Trigger Commands & Switch Contexts

### 1. On Session Start (Mandatory)
* Run `neuron awake` as your **very first tool call** on session start to ingest active L1 memories, daily log tail, and Executive Dashboard.

### 2. Context Pivoting & Memory Switching
* **When USER switches topics or features**: Execute `neuron remember <memory-name>` (e.g., `neuron remember feature-auth`).
  * *Effect*: Focuses active memory on `<memory-name>` and automatically tracks the new feature context.
* **When ending a discussion segment or before pivoting**: Execute `neuron synapsis --summary "Wanted: <goal> | Done: <actions> | Result: <state>"`.
  * *Formula*: Summary **MUST** use the 3-part structured formula (`Wanted: ... | Done: ... | Result: ...`).
  * *Effect*: Closes current fragment and appends line pointers + 1-liner summary to `.memory/memories.json`.

### 3. Offloading Completed Work
* **When a feature or task is completed**: Execute `neuron forget <memory-name>`.
  * *Effect*: Sets `active: false` in `.memory/memories.json`, offloading the memory from L1 active context into deep QMD storage.

### 4. Searching Deep History
* **When USER asks about an un-listed historical idea or past decision**: Execute `neuron search "<query>"`.
  * *Effect*: Performs hybrid vector & BM25 QMD search across past daily logs and transcripts.

---

## Available CLI Commands Reference

* `neuron awake`: Restores active L1 memories, daily log tail, and Executive Dashboard.
* `neuron remember <memory-name>`: Brings `<memory-name>` into active L1 focus.
* `neuron synapsis --summary "Wanted: ... | Done: ... | Result: ..."`: Creates a Synapse Marker.
* `neuron forget <memory-name>`: Offloads a memory from L1 active context.
* `neuron dream`: Condenses fragment summaries into updated L2 summary blobs & syncs QMD.
* `neuron search "<query>"`: Hybrid QMD search across memories, logs, and transcripts.
* `neuron list`: Lists all active/archived memories in `.memory/memories.json`.
* `neuron show <memory-name>`: Displays complete L2 JSON structure for a specific memory.

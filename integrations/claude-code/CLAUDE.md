# Persistent Memory Protocol (neuron-engine)

This workspace uses `neuron-engine` for cross-session episodic and semantic memory.

## Session Start
- Run `neuron awake` as your first shell command to load L1 active focus, L2 context graph nodes, recent daily logs, and `.memory/MEMORY.md`.
- Do not manually read raw `.memory/` files unless `neuron search` points to a specific log line range.

## During Work
- Switch workstreams with `neuron remember <topic>` before starting an unrelated task.
- Record completed milestones with:
  ```bash
  neuron synapsis --summary "Wanted: <goal> | Done: <change> | Result: <verified outcome>"
  ```
- Retrieve prior architectural decisions or debugging history with `neuron search "<query>"`.

## Session End / Compaction
- Offload finished topics from L1 focus with `neuron forget <topic>`.
- Consolidate fragments and refresh vector indices with `neuron dream`.

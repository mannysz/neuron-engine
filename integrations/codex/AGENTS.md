# Persistent Memory Protocol (neuron-engine)

This repository uses `neuron-engine` to maintain persistent context across sessions.

## Required Lifecycle Commands
1. **Session Start:** Execute `neuron awake` to hydrate active L1 focus, L2 graph summaries, recent daily log tail, and `.memory/MEMORY.md`.
2. **Topic Switching:** Execute `neuron remember <workstream-name>` when pivoting to a distinct feature or debugging thread.
3. **Checkpointing:** After verified milestones, run:
   ```bash
   neuron synapsis --summary "Wanted: <goal> | Done: <implementation> | Result: <verification>"
   ```
4. **Recall:** Use `neuron search "<query>"` instead of scanning raw `.memory/logs/*.md` files.
5. **Consolidation:** Run `neuron forget <workstream-name>` when a workstream closes and `neuron dream` to condense fragments and re-index.

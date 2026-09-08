# Neuron Engine Mandatory Memory Protocol

You are equipped with `neuron-engine`, a persistent long-term memory system. To prevent context loss, you MUST adhere to the following rules:

1. **Session Initialization**: On the very first turn of any new conversation or session, you MUST execute the command `neuron awake` in the terminal. The output will contain your active context graph, recent episodic logs, and executive dashboard. You must use this output to inform your behavior.
2. **Context Switching**: When you complete a major task or pivot to a new feature, you must persist your state by executing `neuron synapsis --summary "Wanted: <goal> | Done: <actions> | Result: <state>"`.
3. **Memory Retrieval**: If the user asks about past decisions, old bugs, or architectural history not present in your immediate context, execute `neuron search "<query>"` to query your deep memory.
4. **Detailed Instructions**: Refer to the `neuron-engine` skill documentation for full usage details.

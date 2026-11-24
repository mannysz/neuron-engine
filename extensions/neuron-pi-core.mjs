import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveNeuronBin(env = process.env) {
  const bundled = path.resolve(__dirname, "../bin/neuron");
  if (fs.existsSync(bundled)) return bundled;
  const localBin = path.join(env.HOME || "", ".local/bin/neuron");
  if (fs.existsSync(localBin)) return localBin;
  return "neuron";
}

export function defaultRunNeuronCli(args, cwd) {
  const bin = resolveNeuronBin();
  return execFileSync(bin, args, {
    cwd,
    encoding: "utf8",
    timeout: 15000,
  }).trim();
}

export function extractTouchedFile(input = {}) {
  const rawPath =
    (typeof input.path === "string" && input.path) ||
    (typeof input.TargetFile === "string" && input.TargetFile) ||
    (typeof input.AbsolutePath === "string" && input.AbsolutePath) ||
    "";
  if (!rawPath || rawPath.includes(".memory/") || rawPath.includes(".memory\\")) {
    return null;
  }
  return path.basename(rawPath);
}

export function syncTurnToL3Log({ cwd, prompt, toolsUsed, filesTouched, now = new Date() }) {
  if (!prompt) return null;
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0];

  const logsDir = path.join(cwd, ".memory", "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  const logFile = path.join(logsDir, `${dateStr}.md`);

  const toolsSummary = Array.from(toolsUsed).join(", ") || "None";
  const filesSummary = Array.from(filesTouched).join(", ") || "None";
  const promptSnippet = prompt.replace(/\n+/g, " ").substring(0, 250);

  const logEntry = `
### [${timeStr}] Automatic Session Hook Sync
- **Last User Request**: "${promptSnippet}${prompt.length > 250 ? "..." : ""}"
- **Tools Used**: ${toolsSummary}
- **Files Touched**: ${filesSummary}
`;

  const existingContent = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "";
  if (!existingContent.includes(promptSnippet)) {
    fs.appendFileSync(logFile, logEntry);
  }
  return logFile;
}

export function registerNeuronPiHandlers(
  pi,
  { Type, runCli = defaultRunNeuronCli }
) {
  let injectedAwake = false;
  let lastPrompt = "";
  const toolsUsed = new Set();
  const filesTouched = new Set();

  pi.on("session_start", async () => {
    injectedAwake = false;
    lastPrompt = "";
    toolsUsed.clear();
    filesTouched.clear();
  });

  pi.on("before_agent_start", async (event, ctx) => {
    lastPrompt = (event.prompt || "").trim();
    toolsUsed.clear();
    filesTouched.clear();

    if (!injectedAwake) {
      injectedAwake = true;
      const memoryDir = path.join(ctx.cwd, ".memory");
      if (fs.existsSync(memoryDir)) {
        try {
          const awakeOut = runCli(["awake"], ctx.cwd);
          if (awakeOut) {
            return {
              message: {
                customType: "neuron-awake",
                content: `[neuron-engine awake]\n${awakeOut}`,
                display: false,
              },
            };
          }
        } catch {
          // Graceful fallback if neuron CLI or qmd fails
        }
      }
    }
  });

  pi.on("tool_result", async (event) => {
    if (event.toolName) {
      toolsUsed.add(event.toolName);
    }
    const touched = extractTouchedFile(event.input);
    if (touched) {
      filesTouched.add(touched);
    }
  });

  pi.on("agent_settled", async (_event, ctx) => {
    try {
      syncTurnToL3Log({
        cwd: ctx.cwd,
        prompt: lastPrompt,
        toolsUsed,
        filesTouched,
      });
    } catch {
      // Never block agent settlement on logging error
    } finally {
      lastPrompt = "";
      toolsUsed.clear();
      filesTouched.clear();
    }
  });

  pi.registerCommand("neuron", {
    description: "Run neuron CLI commands (awake, list, search, dream, etc.)",
    handler: async (argsText, ctx) => {
      const args = (argsText || "awake").trim().split(/\s+/).filter(Boolean);
      try {
        const out = runCli(args, ctx.cwd);
        ctx.ui.notify(out || "(no output)", "info");
      } catch (err) {
        ctx.ui.notify(`neuron error: ${err?.message || err}`, "error");
      }
    },
  });

  pi.registerTool({
    name: "neuron_remember",
    label: "Neuron Remember",
    description: "Switch active L1 memory focus to a topic or feature workstream.",
    parameters: Type.Object({
      topic: Type.String({ description: "Short topic/workstream slug, e.g. feature-auth" }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const out = runCli(["remember", params.topic], ctx.cwd);
      return { content: [{ type: "text", text: out || `Focused on ${params.topic}` }], details: undefined };
    },
  });

  pi.registerTool({
    name: "neuron_synapsis",
    label: "Neuron Synapsis",
    description: "Record a milestone fragment marker in L2/L3 memory.",
    parameters: Type.Object({
      summary: Type.String({
        description: "3-part formula: Wanted: ... | Done: ... | Result: ...",
      }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const out = runCli(["synapsis", "--summary", params.summary], ctx.cwd);
      return { content: [{ type: "text", text: out || "Synapsis recorded." }], details: undefined };
    },
  });

  pi.registerTool({
    name: "neuron_search",
    label: "Neuron Search",
    description: "Hybrid vector & BM25 search across neuron memory logs.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const out = runCli(["search", params.query], ctx.cwd);
      return { content: [{ type: "text", text: out || "No matches." }], details: undefined };
    },
  });

  pi.registerTool({
    name: "neuron_forget",
    label: "Neuron Forget",
    description: "Offload a completed topic from active L1 focus.",
    parameters: Type.Object({
      topic: Type.String({ description: "Topic slug to archive from L1" }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const out = runCli(["forget", params.topic], ctx.cwd);
      return { content: [{ type: "text", text: out || `Forgot ${params.topic}` }], details: undefined };
    },
  });
}

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  extractTouchedFile,
  registerNeuronPiHandlers,
  resolveNeuronBin,
} from "../extensions/neuron-pi-core.mjs";

function createMockPi() {
  const handlers = {};
  const tools = {};
  const commands = {};
  return {
    handlers,
    tools,
    commands,
    on(event, fn) {
      handlers[event] = fn;
    },
    registerTool(def) {
      tools[def.name] = def;
    },
    registerCommand(name, def) {
      commands[name] = def;
    },
  };
}

const mockType = {
  Object: (props) => props,
  String: (opts) => opts,
};

test("resolveNeuronBin prefers bundled bin/neuron", () => {
  const bin = resolveNeuronBin({ HOME: "/nonexistent" });
  assert.equal(bin.endsWith(path.join("bin", "neuron")), true);
  assert.equal(fs.existsSync(bin), true);
});

test("extractTouchedFile ignores .memory paths and returns basename", () => {
  assert.equal(extractTouchedFile({ path: "/tmp/app/src/index.ts" }), "index.ts");
  assert.equal(extractTouchedFile({ path: "/tmp/app/.memory/logs/2026-11-18.md" }), null);
  assert.equal(extractTouchedFile({}), null);
});

test("before_agent_start injects awake once when .memory exists, and skips when absent", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuron-pi-test-"));
  try {
    const cliCalls = [];
    const pi = createMockPi();
    registerNeuronPiHandlers(pi, {
      Type: mockType,
      runCli: (args, cwd) => {
        cliCalls.push({ args, cwd });
        return "L1 ACTIVE: test-topic";
      },
    });

    // No .memory directory yet -> should not inject awake
    await pi.handlers.session_start({}, { cwd: tmpDir });
    const resNoMem = await pi.handlers.before_agent_start({ prompt: "hello" }, { cwd: tmpDir });
    assert.equal(resNoMem, undefined);
    assert.equal(cliCalls.length, 0);

    // With .memory directory -> injects on first turn of new session only
    fs.mkdirSync(path.join(tmpDir, ".memory"), { recursive: true });
    await pi.handlers.session_start({}, { cwd: tmpDir });
    const res1 = await pi.handlers.before_agent_start({ prompt: "first" }, { cwd: tmpDir });
    assert.equal(res1.message.customType, "neuron-awake");
    assert.match(res1.message.content, /L1 ACTIVE: test-topic/);
    assert.equal(res1.message.display, false);

    const res2 = await pi.handlers.before_agent_start({ prompt: "second" }, { cwd: tmpDir });
    assert.equal(res2, undefined);
    assert.equal(cliCalls.length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("tool_result + agent_settled syncs central L3 daily log and deduplicates", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuron-pi-log-"));
  try {
    const pi = createMockPi();
    registerNeuronPiHandlers(pi, { Type: mockType, runCli: () => "" });

    await pi.handlers.session_start({}, { cwd: tmpDir });
    await pi.handlers.before_agent_start(
      { prompt: "Add health endpoint to server.ts" },
      { cwd: tmpDir }
    );
    await pi.handlers.tool_result({
      toolName: "write",
      input: { path: path.join(tmpDir, "src", "server.ts") },
    });
    await pi.handlers.tool_result({
      toolName: "read",
      input: { path: path.join(tmpDir, ".memory", "MEMORY.md") },
    });
    await pi.handlers.agent_settled({ aborted: false }, { cwd: tmpDir });

    const today = new Date().toISOString().split("T")[0];
    const logPath = path.join(tmpDir, ".memory", "logs", `${today}.md`);
    assert.equal(fs.existsSync(logPath), true);
    const content = fs.readFileSync(logPath, "utf8");
    assert.match(content, /Add health endpoint to server\.ts/);
    assert.match(content, /Tools Used\*\*: write, read/);
    assert.match(content, /Files Touched\*\*: server\.ts/);
    assert.doesNotMatch(content, /MEMORY\.md/);

    // Duplicate prompt on same day should not double-append
    await pi.handlers.before_agent_start(
      { prompt: "Add health endpoint to server.ts" },
      { cwd: tmpDir }
    );
    await pi.handlers.agent_settled({ aborted: false }, { cwd: tmpDir });
    const afterDup = fs.readFileSync(logPath, "utf8");
    assert.equal(afterDup, content);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("registered tools and /neuron command delegate to neuron CLI", async () => {
  const calls = [];
  const notices = [];
  const pi = createMockPi();
  registerNeuronPiHandlers(pi, {
    Type: mockType,
    runCli: (args, cwd) => {
      calls.push({ args, cwd });
      return `ok:${args.join(" ")}`;
    },
  });

  const ctx = {
    cwd: "/tmp/proj",
    ui: { notify: (msg, level) => notices.push({ msg, level }) },
  };

  await pi.tools.neuron_remember.execute("1", { topic: "auth-fix" }, null, null, ctx);
  await pi.tools.neuron_synapsis.execute("2", { summary: "Wanted: X | Done: Y | Result: Z" }, null, null, ctx);
  await pi.tools.neuron_search.execute("3", { query: "OAuth" }, null, null, ctx);
  await pi.tools.neuron_forget.execute("4", { topic: "auth-fix" }, null, null, ctx);
  await pi.commands.neuron.handler("list", ctx);

  assert.deepEqual(calls.map((c) => c.args), [
    ["remember", "auth-fix"],
    ["synapsis", "--summary", "Wanted: X | Done: Y | Result: Z"],
    ["search", "OAuth"],
    ["forget", "auth-fix"],
    ["list"],
  ]);
  assert.equal(notices[0].msg, "ok:list");
});

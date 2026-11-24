import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const BIN_NEURON = path.resolve('bin/neuron.js');
const BIN_AUTOLOG = path.resolve('bin/auto-log.js');

function makeTempWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuron-cli-test-'));
  fs.mkdirSync(path.join(dir, '.git'));
  return dir;
}

function runNeuron(cwd, args) {
  return execFileSync(process.execPath, [BIN_NEURON, ...args], {
    cwd,
    encoding: 'utf8'
  });
}

test('full L1/L2/L3 CLI lifecycle: awake, remember, synapsis, dream, search, list, show, forget', () => {
  const ws = makeTempWorkspace();
  try {
    const awakeOut = runNeuron(ws, ['awake']);
    assert.match(awakeOut, /AWAKE - RESUMING ACTIVE CONSCIOUSNESS/);
    assert.ok(fs.existsSync(path.join(ws, '.memory', 'memories.json')));
    assert.ok(fs.existsSync(path.join(ws, '.memory', 'MEMORY.md')));

    const remOut = runNeuron(ws, ['remember', 'oauth-migration']);
    assert.match(remOut, /Focused active memory on \[oauth-migration\]/);

    const synOut = runNeuron(ws, [
      'synapsis',
      '--summary',
      'Wanted: Rotate JWT keys | Done: Added JWKS cache | Result: All 24 auth tests pass'
    ]);
    assert.match(synOut, /Created Synapse Marker for \[oauth-migration\]/);

    const dreamOut = runNeuron(ws, ['dream']);
    assert.match(dreamOut, /Dream consolidation complete/);

    const showOut = runNeuron(ws, ['show', 'oauth-migration']);
    const node = JSON.parse(showOut);
    assert.equal(node.name, 'oauth-migration');
    assert.equal(node.active, true);
    assert.equal(node.fragments.length, 1);
    assert.match(node.summary, /Rotate JWT keys/);

    const searchOut = runNeuron(ws, ['search', 'JWKS']);
    assert.match(searchOut, /oauth-migration/);

    const listOut = runNeuron(ws, ['list']);
    assert.match(listOut, /\[oauth-migration\] - active: true/);

    const forgetOut = runNeuron(ws, ['forget', 'oauth-migration']);
    assert.match(forgetOut, /Offloaded memory \[oauth-migration\]/);

    const afterForget = JSON.parse(runNeuron(ws, ['show', 'oauth-migration']));
    assert.equal(afterForget.active, false);
  } finally {
    fs.rmSync(ws, { recursive: true, force: true });
  }
});

test('auto-log hook ingests Claude Code JSONL transcripts and cwd payload', () => {
  const ws = makeTempWorkspace();
  try {
    const transcript = path.join(ws, 'claude-transcript.jsonl');
    const lines = [
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'Refactor token verifier to support Ed25519 keys' }
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', name: 'Edit', input: { file_path: path.join(ws, 'src/auth.ts') } }
          ]
        }
      })
    ];
    fs.writeFileSync(transcript, lines.join('\n') + '\n', 'utf8');

    const payload = JSON.stringify({ cwd: ws, transcript_path: transcript });
    const out = execFileSync(process.execPath, [BIN_AUTOLOG], {
      input: payload,
      encoding: 'utf8'
    });
    assert.equal(out.trim(), '{}');

    const logsDir = path.join(ws, '.memory', 'logs');
    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.md'));
    assert.equal(logFiles.length, 1);
    const content = fs.readFileSync(path.join(logsDir, logFiles[0]), 'utf8');
    assert.match(content, /Refactor token verifier to support Ed25519 keys/);
    assert.match(content, /Edit/);
    assert.match(content, /auth\.ts/);
  } finally {
    fs.rmSync(ws, { recursive: true, force: true });
  }
});

test('auto-log hook ingests Antigravity JSONL transcripts and workspacePaths payload', () => {
  const ws = makeTempWorkspace();
  try {
    const transcript = path.join(ws, 'agy-transcript.jsonl');
    const lines = [
      JSON.stringify({
        type: 'USER_INPUT',
        content: '<USER_REQUEST>Fix race condition in worker queue</USER_REQUEST>'
      }),
      JSON.stringify({
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'edit_file', args: { Path: path.join(ws, 'src/queue.js') } }]
      })
    ];
    fs.writeFileSync(transcript, lines.join('\n') + '\n', 'utf8');

    const payload = JSON.stringify({ workspacePaths: [ws], transcriptPath: transcript });
    const out = execFileSync(process.execPath, [BIN_AUTOLOG], {
      input: payload,
      encoding: 'utf8'
    });
    assert.equal(out.trim(), '{}');

    const logsDir = path.join(ws, '.memory', 'logs');
    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.md'));
    assert.equal(logFiles.length, 1);
    const content = fs.readFileSync(path.join(logsDir, logFiles[0]), 'utf8');
    assert.match(content, /Fix race condition in worker queue/);
    assert.match(content, /edit_file/);
    assert.match(content, /queue\.js/);
  } finally {
    fs.rmSync(ws, { recursive: true, force: true });
  }
});

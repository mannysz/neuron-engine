#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findWorkspaceRoot() {
  let current = process.cwd();
  while (current && current !== path.parse(current).root) {
    if (fs.existsSync(path.join(current, '.memory')) || fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}

const WORKSPACE_ROOT = findWorkspaceRoot();
const MEMORY_DIR = path.join(WORKSPACE_ROOT, '.memory');
const LOGS_DIR = path.join(MEMORY_DIR, 'logs');
const MEMORIES_JSON = path.join(MEMORY_DIR, 'memories.json');
const MEMORY_MD = path.join(MEMORY_DIR, 'MEMORY.md');
const LAST_CONSOLIDATED = path.join(MEMORY_DIR, '.last_consolidated');

// Ensure base directories
fs.mkdirSync(LOGS_DIR, { recursive: true });

// Ensure default MEMORY.md template if not present
if (!fs.existsSync(MEMORY_MD)) {
  const defaultMd = `# Executive Memory Dashboard

> **Ground Rules**: This file is maintained automatically by \`neuron-engine\`.
> It contains high-level project goals, core user preferences, and strategic lessons learned across projects.
> **Line Limit**: Must be kept under 500 lines.

---

## 1. Portfolio & Project Index

| Project / App | Stage | Primary Tech Stack | Status / Target |
| :--- | :--- | :--- | :--- |

---

## 2. Core User Preferences & Working Style

* **User**: [User Name / Persona]
* **Communication**: Direct, analytical, collaborative, crisp.
* **Architecture**: SOLID principles, clean component separation.
* **Memory Management**: 3-tiered PNG-RAG memory (L1 Working, L2 Context Graph, L3 Episodic Logs & Vector RAG).

---

## 3. Strategic Guidelines & Lessons Learned

* **Project Scope**: Individual projects manage their own technical docs, schemas, and README.md files.
* **Executive Summary**: MEMORY.md tracks high-level business goals, synergy between apps, and recurring preferences across projects.
`;
  fs.writeFileSync(MEMORY_MD, defaultMd, 'utf8');
}

function loadMemoriesState() {
  if (!fs.existsSync(MEMORIES_JSON)) {
    const initialState = {
      active_memory: "core",
      memories: [
        {
          name: "core",
          active: true,
          summary: "Core memory engine node for initial workspace context",
          fragments: []
        }
      ]
    };
    fs.writeFileSync(MEMORIES_JSON, JSON.stringify(initialState, null, 2), 'utf8');
    return initialState;
  }
  try {
    return JSON.parse(fs.readFileSync(MEMORIES_JSON, 'utf8'));
  } catch (e) {
    return { active_memory: null, memories: [] };
  }
}

function saveMemoriesState(state) {
  fs.writeFileSync(MEMORIES_JSON, JSON.stringify(state, null, 2), 'utf8');
}

function needsConsolidation() {
  if (!fs.existsSync(LAST_CONSOLIDATED)) return true;
  const lastTime = fs.statSync(LAST_CONSOLIDATED).mtimeMs;
  const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const mtime = fs.statSync(path.join(LOGS_DIR, f)).mtimeMs;
    if (mtime > lastTime) return true;
  }
  return false;
}

function runQmdIndex() {
  try {
    execSync('qmd index .memory', { stdio: 'ignore', cwd: WORKSPACE_ROOT });
    return true;
  } catch (e) {
    return false;
  }
}

const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'awake': {
    console.log('==========================================');
    console.log('[neuron-engine] AWAKE - RESUMING ACTIVE CONSCIOUSNESS');
    console.log('==========================================');

    const state = loadMemoriesState();

    if (needsConsolidation()) {
      console.log('[neuron-engine] Log updates detected. Triggering dream consolidation...');
      runQmdIndex();
      fs.writeFileSync(LAST_CONSOLIDATED, new Date().toISOString());
    }

    const activeMemories = state.memories.filter(m => m.active);
    console.log(`--- Active L2 Context Graph (${activeMemories.length} Active Memories) ---`);
    if (activeMemories.length === 0) {
      console.log('(No active memories. Use "neuron remember <name>" to focus a topic)');
    } else {
      activeMemories.forEach(m => {
        console.log(`\n• [Memory: ${m.name}]${m.name === state.active_memory ? ' *(Current Focus)*' : ''}`);
        console.log(`  Summary: ${m.summary || '(No summary)'}`);
        if (m.fragments && m.fragments.length > 0) {
          console.log(`  Fragments (${m.fragments.length}):`);
          m.fragments.slice(-3).forEach(f => {
            console.log(`    - [${path.basename(f.file)}:L${f.start}-${f.end}] ${f.summary}`);
          });
        }
      });
    }

    console.log('\n==========================================');

    // Tail newest non-empty daily log
    const logFiles = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse();

    let targetLog = logFiles[0];
    if (targetLog && fs.statSync(path.join(LOGS_DIR, targetLog)).size === 0 && logFiles.length > 1) {
      targetLog = logFiles[1];
    }

    if (targetLog) {
      const logPath = path.join(LOGS_DIR, targetLog);
      console.log(`--- Recent Episodic Log (${targetLog}) ---`);
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n');
      console.log(lines.slice(-35).join('\n'));
      console.log('==========================================');
    }

    console.log('--- Executive Dashboard (MEMORY.md) ---');
    console.log(fs.readFileSync(MEMORY_MD, 'utf8'));
    break;
  }

  case 'dream': {
    console.log('[neuron-engine] DREAM - Consolidating memory fragments & re-indexing vector embeddings...');
    const state = loadMemoriesState();

    // Condense fragment summaries for each memory into updated L2 summary
    for (const mem of state.memories) {
      if (mem.fragments && mem.fragments.length > 0) {
        const recentSummaries = mem.fragments.slice(-5).map(f => f.summary).join(' | ');
        mem.summary = `Condensed L2 Context: ${recentSummaries.substring(0, 300)}`;
      }
    }

    saveMemoriesState(state);
    runQmdIndex();

    fs.writeFileSync(LAST_CONSOLIDATED, new Date().toISOString());
    console.log('[neuron-engine] Dream consolidation complete. L2 context graph updated.');
    break;
  }

  case 'remember': {
    const memoryName = args[1];
    if (!memoryName) {
      console.error('Usage: neuron remember <memory-name>');
      process.exit(1);
    }

    const state = loadMemoriesState();
    const prevMemory = state.active_memory;

    // Set active memory
    state.active_memory = memoryName;
    let target = state.memories.find(m => m.name === memoryName);
    if (!target) {
      target = {
        name: memoryName,
        active: true,
        summary: `Newly initialized memory focus: ${memoryName}`,
        fragments: []
      };
      state.memories.push(target);
    } else {
      target.active = true;
    }

    saveMemoriesState(state);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const logFile = path.join(LOGS_DIR, `${dateStr}.md`);

    const logEntry = `\n### [${timeStr}] Focused Memory: [${memoryName}]\n- Switched focus from ${prevMemory || 'none'} to ${memoryName}\n`;
    fs.appendFileSync(logFile, logEntry);

    console.log(`[neuron-engine] Focused active memory on [${memoryName}]. Prev: ${prevMemory || 'none'}.`);
    break;
  }

  case 'synapsis': {
    let summary = '';
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--summary' && args[i + 1]) {
        summary = args[i + 1];
        break;
      }
    }
    if (!summary && args[1] && !args[1].startsWith('--')) {
      summary = args.slice(1).join(' ');
    }

    if (!summary) {
      summary = 'Completed memory fragment and updated context state';
    }

    const state = loadMemoriesState();
    const activeName = state.active_memory || 'general';
    let target = state.memories.find(m => m.name === activeName);

    if (!target) {
      target = {
        name: activeName,
        active: true,
        summary: summary,
        fragments: []
      };
      state.memories.push(target);
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const logFile = path.join(LOGS_DIR, `${dateStr}.md`);

    // Estimate line numbers in current log file
    let lineCount = 1;
    if (fs.existsSync(logFile)) {
      lineCount = fs.readFileSync(logFile, 'utf8').split('\n').length;
    }

    const startLine = Math.max(1, lineCount - 15);
    const endLine = lineCount + 3;

    const fragment = {
      file: `.memory/logs/${dateStr}.md`,
      start: startLine,
      end: endLine,
      summary: summary
    };

    target.fragments.push(fragment);
    saveMemoriesState(state);

    const logEntry = `\n### [${timeStr}] [synapsis:${activeName}] Fragment Marker\n- Summary: ${summary}\n- Range: L${startLine}-L${endLine}\n`;
    fs.appendFileSync(logFile, logEntry);

    console.log(`[neuron-engine] Created Synapse Marker for [${activeName}]: "${summary}"`);
    break;
  }

  case 'forget': {
    const memoryName = args[1];
    if (!memoryName) {
      console.error('Usage: neuron forget <memory-name>');
      process.exit(1);
    }

    const state = loadMemoriesState();
    const target = state.memories.find(m => m.name === memoryName);

    if (target) {
      target.active = false;
      if (state.active_memory === memoryName) {
        state.active_memory = null;
      }
      saveMemoriesState(state);
      console.log(`[neuron-engine] Offloaded memory [${memoryName}] from active L1 context.`);
    } else {
      console.log(`[neuron-engine] Memory [${memoryName}] not found in state.`);
    }
    break;
  }

  case 'search': {
    const query = args.slice(1).join(' ');
    console.log(`[neuron-engine] SEARCHing memory for: "${query || 'all'}"`);
    console.log('==========================================');

    const state = loadMemoriesState();
    const matchingMemories = state.memories.filter(m => 
      !query || m.name.toLowerCase().includes(query.toLowerCase()) || (m.summary && m.summary.toLowerCase().includes(query.toLowerCase()))
    );

    if (matchingMemories.length > 0) {
      console.log('--- Matching L2 Context Graph Nodes ---');
      matchingMemories.forEach(m => {
        console.log(`• [Memory: ${m.name}] (active: ${m.active})`);
        console.log(`  Summary: ${m.summary}`);
      });
      console.log('==========================================');
    }

    try {
      const qmdRes = execSync(`qmd search "${query || 'memory'}"`, { encoding: 'utf8', cwd: WORKSPACE_ROOT });
      console.log('--- QMD Vector RAG Results ---');
      console.log(qmdRes);
    } catch (e) {
      console.log('--- Log Matches ---');
      const logFiles = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.md'));
      for (const f of logFiles) {
        const content = fs.readFileSync(path.join(LOGS_DIR, f), 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          console.log(`Found match in ${f}`);
        }
      }
    }
    break;
  }

  case 'list': {
    const state = loadMemoriesState();
    console.log('==========================================');
    console.log(`[neuron-engine] L2 Context Graph (${state.memories.length} Total Memories)`);
    console.log('==========================================');
    state.memories.forEach(m => {
      console.log(`• [${m.name}] - active: ${m.active}`);
      console.log(`  Summary: ${m.summary}`);
      console.log(`  Fragments: ${m.fragments.length}`);
    });
    break;
  }

  case 'show': {
    const memoryName = args[1];
    const state = loadMemoriesState();
    const target = state.memories.find(m => m.name === memoryName);

    if (!target) {
      console.log(`Memory [${memoryName}] not found.`);
    } else {
      console.log(JSON.stringify(target, null, 2));
    }
    break;
  }

  default: {
    console.log('Usage: neuron {awake|dream|remember <name>|synapsis --summary "<wanted \| done \| result>"|forget <name>|search <query>|list|show <name>}');
    break;
  }
}

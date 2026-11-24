#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Passive lifecycle hook for Antigravity (agy) and Claude Code.
 * Reads hook JSON payload from stdin and appends a concise episodic entry
 * to .memory/logs/YYYY-MM-DD.md without invoking an LLM.
 */
async function main() {
  let stdinData = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    stdinData += chunk;
  }

  let payload = {};
  try {
    if (stdinData.trim()) {
      payload = JSON.parse(stdinData);
    }
  } catch (e) {
    // Ignore malformed stdin
  }

  // Support both Antigravity (workspacePaths, transcriptPath) and Claude Code (cwd, transcript_path)
  const workspaceDir =
    (payload.workspacePaths && payload.workspacePaths[0]) ||
    payload.cwd ||
    process.cwd();
  const transcriptPath = payload.transcriptPath || payload.transcript_path;

  let lastUserPrompt = '';
  const toolCallsMade = new Set();
  const modifiedFiles = new Set();

  // Direct Claude Code PostToolUse payload fields (when invoked without full transcript scan)
  if (payload.tool_name) {
    toolCallsMade.add(payload.tool_name);
  }
  if (payload.tool_input && (payload.tool_input.file_path || payload.tool_input.path)) {
    const f = payload.tool_input.file_path || payload.tool_input.path;
    if (f && !f.includes('.memory/')) {
      modifiedFiles.add(path.basename(f));
    }
  }

  if (transcriptPath && fs.existsSync(transcriptPath)) {
    try {
      const fileContent = fs.readFileSync(transcriptPath, 'utf8');
      const lines = fileContent.split('\n').filter(Boolean);

      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const entry = JSON.parse(lines[i]);

          // Antigravity transcript format
          if (entry.type === 'USER_INPUT' && entry.content && !lastUserPrompt) {
            const match = entry.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
            lastUserPrompt = match ? match[1].trim() : entry.content.trim();
          }

          // Claude Code JSONL transcript format ({ type: "user", message: { role: "user", content: ... } })
          if (!lastUserPrompt && (entry.type === 'user' || entry.role === 'user')) {
            const raw = entry.message ? entry.message.content : entry.content;
            if (typeof raw === 'string' && raw.trim()) {
              lastUserPrompt = raw.trim();
            } else if (Array.isArray(raw)) {
              const textBlock = raw.find(b => b && b.type === 'text' && b.text);
              if (textBlock) lastUserPrompt = textBlock.text.trim();
            }
          }

          // Antigravity tool_calls
          if (entry.tool_calls && Array.isArray(entry.tool_calls)) {
            for (const tc of entry.tool_calls) {
              if (tc.name) toolCallsMade.add(tc.name);
              if (tc.args && (tc.args.TargetFile || tc.args.AbsolutePath || tc.args.Path)) {
                const file = tc.args.TargetFile || tc.args.AbsolutePath || tc.args.Path;
                if (file && !file.includes('.memory/')) {
                  modifiedFiles.add(path.basename(file));
                }
              }
            }
          }

          // Claude Code assistant tool_use content blocks
          const blocks = entry.message && Array.isArray(entry.message.content) ? entry.message.content : [];
          for (const block of blocks) {
            if (block && block.type === 'tool_use') {
              if (block.name) toolCallsMade.add(block.name);
              const fp = block.input && (block.input.file_path || block.input.path);
              if (fp && !fp.includes('.memory/')) {
                modifiedFiles.add(path.basename(fp));
              }
            }
          }
        } catch (e) {}

        if (lastUserPrompt && i < lines.length - 25) break;
      }
    } catch (err) {}
  }

  if (!lastUserPrompt && toolCallsMade.size === 0) {
    console.log(JSON.stringify({}));
    return;
  }

  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const memoryDir = path.join(workspaceDir, '.memory');
    const logsDir = path.join(memoryDir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, `${dateStr}.md`);

    const toolsSummary = Array.from(toolCallsMade).join(', ') || 'None';
    const filesSummary = Array.from(modifiedFiles).join(', ') || 'None';
    const promptSnippet = lastUserPrompt
      ? lastUserPrompt.replace(/\n+/g, ' ').substring(0, 250)
      : `Tool activity (${toolsSummary})`;

    const logEntry = `
### [${timeStr}] Automatic Session Hook Sync
- **Last User Request**: "${promptSnippet}${lastUserPrompt.length > 250 ? '...' : ''}"
- **Tools Used**: ${toolsSummary}
- **Files Touched**: ${filesSummary}
`;

    let existingContent = '';
    if (fs.existsSync(logFile)) {
      existingContent = fs.readFileSync(logFile, 'utf8');
    }

    if (!existingContent.includes(promptSnippet)) {
      fs.appendFileSync(logFile, logEntry);
    }
  } catch (err) {}

  console.log(JSON.stringify({}));
}

main();

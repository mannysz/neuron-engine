#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
    // Ignore parse errors
  }

  const workspaceDir = (payload.workspacePaths && payload.workspacePaths[0]) || process.cwd();
  const transcriptPath = payload.transcriptPath;

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    console.log(JSON.stringify({}));
    return;
  }

  try {
    const fileContent = fs.readFileSync(transcriptPath, 'utf8');
    const lines = fileContent.split('\n').filter(Boolean);

    let lastUserPrompt = '';
    const toolCallsMade = new Set();
    const modifiedFiles = new Set();

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === 'USER_INPUT' && entry.content && !lastUserPrompt) {
          const match = entry.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
          lastUserPrompt = match ? match[1].trim() : entry.content.trim();
        }

        if (entry.tool_calls && Array.isArray(entry.tool_calls)) {
          for (const tc of entry.tool_calls) {
            if (tc.name) toolCallsMade.add(tc.name);
            if (tc.args && (tc.args.TargetFile || tc.args.AbsolutePath)) {
              const file = tc.args.TargetFile || tc.args.AbsolutePath;
              if (file && !file.includes('.memory/')) {
                modifiedFiles.add(path.basename(file));
              }
            }
          }
        }
      } catch (e) {}

      if (lastUserPrompt && i < lines.length - 20) break;
    }

    if (!lastUserPrompt) {
      console.log(JSON.stringify({}));
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const memoryDir = path.join(workspaceDir, '.memory');
    const logsDir = path.join(memoryDir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, `${dateStr}.md`);

    const toolsSummary = Array.from(toolCallsMade).join(', ') || 'None';
    const filesSummary = Array.from(modifiedFiles).join(', ') || 'None';
    const promptSnippet = lastUserPrompt.replace(/\n+/g, ' ').substring(0, 250);

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

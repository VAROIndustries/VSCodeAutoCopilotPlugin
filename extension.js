const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// e.g. "2026-10-19 14:08:23.741 [info] ccreq:3b71d32c.copilotmd | success | gpt-6-luna | 5773ms | [panel/editAgent]"
const RE = /^(\S+ \S+) \[\w+\] ccreq:\S+ \| (\w+) \| (\S+) \| \S+ \| \[(panel\/[^\]]+)\]/;

// Returns the last chat-panel request in `text`, skipping background agents (todo, titles, etc.).
function lastPanelRequest(text) {
  let hit = null;
  for (const line of text.split(/\r?\n/)) {
    const m = RE.exec(line);
    if (m) hit = { time: m[1], status: m[2], model: m[3], location: m[4] };
  }
  return hit;
}

function activate(context) {
  // ponytail: no public API exposes Auto's pick, so tail Copilot Chat's own log. Breaks if they change the ccreq format.
  // ponytail: ccreq is logged when a request finishes, so this is "last completed turn", not mid-stream.
  const log = path.join(path.dirname(context.logUri.fsPath), 'GitHub.copilot-chat', 'GitHub Copilot Chat.log');
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = '$(copilot) Auto: —';
  item.tooltip = `Waiting for Copilot Chat requests\n${log}`;
  item.show();

  let offset = 0;
  const read = () => {
    let size;
    try { size = fs.statSync(log).size; } catch { return; } // log not created yet
    if (size < offset) offset = 0;
    if (size === offset) return;
    const fd = fs.openSync(log, 'r');
    const buf = Buffer.alloc(size - offset);
    fs.readSync(fd, buf, 0, buf.length, offset);
    fs.closeSync(fd);
    const text = buf.toString('utf8');
    const lastNl = text.lastIndexOf('\n');
    if (lastNl < 0) return; // wait for a full line
    offset += Buffer.byteLength(text.slice(0, lastNl + 1));
    const hit = lastPanelRequest(text.slice(0, lastNl));
    if (!hit) return;
    item.text = `$(copilot) ${hit.model}`;
    item.tooltip = `Copilot model: ${hit.model}\n${hit.location} · ${hit.status}\n${hit.time}`;
  };

  read();
  fs.watchFile(log, { interval: 1000 }, read);
  context.subscriptions.push(item, { dispose: () => fs.unwatchFile(log, read) });
}

module.exports = { activate, deactivate() {}, lastPanelRequest };

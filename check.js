// Self-check: node check.js [path-to-GitHub Copilot Chat.log]
const assert = require('assert');
const Module = require('module');
const load = Module._load;
Module._load = (r, ...a) => (r === 'vscode' ? {} : load(r, ...a));
const { lastPanelRequest } = require('./extension');

const sample = [
  '2026-10-19 14:08:23.741 [info] ccreq:3b71d32c.copilotmd | success | gpt-6-luna | 5773ms | [panel/editAgent]',
  '2026-10-19 14:08:25.351 [info] ccreq:5a7ff758.copilotmd | success | gpt-4o-mini-2024-07-18 | 1049ms | [backgroundTodoAgent]',
].join('\n');
assert.strictEqual(lastPanelRequest(sample).model, 'gpt-6-luna');
assert.strictEqual(lastPanelRequest('nothing here'), null);

if (process.argv[2]) console.log(lastPanelRequest(require('fs').readFileSync(process.argv[2], 'utf8')));
console.log('ok');

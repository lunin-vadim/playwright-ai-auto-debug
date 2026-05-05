// src/infrastructure/mcp/McpClient.js

import { spawn } from 'child_process';
import { createInterface } from 'readline';

/**
 * MCP Client for @playwright/mcp server.
 * Spawns the server as a child process and communicates via JSON-RPC 2.0 over stdio.
 */
export class McpClient {
  constructor(config) {
    this.config = config;
    this._process = null;
    this._rl = null;
    this._pending = new Map();
    this._nextId = 1;
    this._ready = false;
  }

  /** True when the server process is alive and the MCP handshake is complete. */
  get connected() {
    return this._ready && !!this._process && !this._process.killed;
  }

  /**
   * Spawns the MCP server and completes the initialize handshake.
   * Retries up to mcp_retry_attempts times on failure.
   * @returns {Promise<boolean>} true on success
   */
  async start() {
    if (this.connected) return true;

    const attempts = Math.max(1, this.config.mcp_retry_attempts || 3);

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await this._spawnAndHandshake();
        console.log('✅ MCP client connected');
        return true;
      } catch (err) {
        console.error(`❌ MCP start failed (attempt ${attempt}/${attempts}): ${err.message}`);
        await this.cleanup();
        if (attempt < attempts) {
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }
    }

    return false;
  }

  /**
   * Returns an accessibility-tree snapshot of the current page.
   * If url is provided, navigates there first.
   * @param {string} [url]
   * @returns {Promise<{content: string, elements: Array<{ref: string, role: string, name: string}>, timestamp: number}>}
   */
  async getSnapshot(url) {
    if (!this.connected) throw new Error('MCP client is not connected');

    if (url) {
      await this._callTool('browser_navigate', { url });
    }
    const result = await this._callTool('browser_snapshot', {});
    return this._parseSnapshot(result);
  }

  /**
   * Executes browser actions and reports which ones succeeded.
   * @param {Array<{type: string, ref: string, name?: string, value?: string}>} actions
   * @returns {Promise<{totalActions: number, successfulActions: number, results: Array}>}
   */
  async validateActions(actions) {
    if (!this.connected) throw new Error('MCP client is not connected');

    const results = [];
    let successfulActions = 0;

    for (const action of actions) {
      try {
        if (action.type === 'click') {
          await this._callTool('browser_click', {
            element: action.name || action.ref,
            target: action.ref
          });
        } else if (action.type === 'fill') {
          await this._callTool('browser_fill', {
            element: action.name || action.ref,
            target: action.ref,
            value: action.value
          });
        } else {
          throw new Error(`Unknown action type: ${action.type}`);
        }
        results.push({ action, success: true });
        successfulActions++;
      } catch (err) {
        results.push({ action, success: false, error: err.message });
      }
    }

    return { totalActions: actions.length, successfulActions, results };
  }

  /**
   * Kills the server process and rejects any pending requests.
   */
  async cleanup() {
    this._ready = false;
    if (this._rl) {
      this._rl.close();
      this._rl = null;
    }
    if (this._process && !this._process.killed) {
      this._process.kill();
    }
    this._process = null;
    this._rejectAll(new Error('MCP client cleaned up'));
  }

  // ─── private helpers ────────────────────────────────────────────────────────

  async _spawnAndHandshake() {
    const command = this.config.mcp_command || 'npx';
    const rawArgs = this.config.mcp_args || ['@playwright/mcp@latest'];
    const args = command === 'npx' && !rawArgs.includes('-y')
      ? ['-y', ...rawArgs]
      : [...rawArgs];

    this._process = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    this._process.on('error', (err) => {
      this._rejectAll(err);
    });

    this._process.on('exit', (code) => {
      this._ready = false;
      if (code !== 0 && code !== null) {
        this._rejectAll(new Error(`MCP process exited with code ${code}`));
      }
    });

    // Always drain stderr — prevents OS buffer overflow; log only in debug mode.
    this._process.stderr.on('data', (d) => {
      if (process.env.DEBUG_MCP) process.stderr.write(`[mcp] ${d}`);
    });

    this._rl = createInterface({ input: this._process.stdout, crlfDelay: Infinity });
    this._rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined) {
          const handler = this._pending.get(msg.id);
          if (handler) {
            this._pending.delete(msg.id);
            if (msg.error) {
              handler.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              handler.resolve(msg.result);
            }
          }
        }
      } catch {
        // ignore non-JSON lines (browser startup noise)
      }
    });

    await this._request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'playwright-ai-debug', version: '1.0.0' }
    });

    this._notify('notifications/initialized', {});
    this._ready = true;
  }

  _request(method, params) {
    if (!this._process) {
      return Promise.reject(new Error('MCP process is not running'));
    }

    return new Promise((resolve, reject) => {
      const id = this._nextId++;
      const timeout = this.config.mcp_timeout || 30000;

      const timer = setTimeout(() => {
        if (this._pending.has(id)) {
          this._pending.delete(id);
          reject(new Error(`MCP request timed out: ${method}`));
        }
      }, timeout);

      this._pending.set(id, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });

      this._process.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  _notify(method, params) {
    if (!this._process) return;
    this._process.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  _callTool(name, args) {
    return this._request('tools/call', { name, arguments: args });
  }

  /**
   * Parses the accessibility tree text from browser_snapshot into structured elements.
   *
   * Each line of the tree has the form:
   *   - <role> "<name>" [ref=eN]
   *   - generic [active] [ref=eN]: <text>
   */
  _parseSnapshot(result) {
    const text = result?.content?.[0]?.text ?? result?.snapshot ?? '';
    const elements = [];

    // Matches: optional role, optional quoted name, and a [ref=...] tag
    const lineRe = /^\s*-\s*(?:(\w[\w\s]*?)\s+)?(?:"([^"]+)"\s+)?\[ref=(\w+)\]/;
    for (const line of text.split('\n')) {
      const m = lineRe.exec(line);
      if (m) {
        elements.push({
          ref: m[3],
          role: (m[1] || 'generic').trim(),
          name: m[2] || ''
        });
      }
    }

    return { content: text, elements, timestamp: Date.now() };
  }

  _rejectAll(err) {
    for (const { reject } of this._pending.values()) {
      reject(err);
    }
    this._pending.clear();
  }
}

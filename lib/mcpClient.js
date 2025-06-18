import { spawn } from 'child_process';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

/**
 * Playwright MCP Client for DOM snapshot and browser automation
 */
class McpClient extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      mcpCommand: 'npx',
      mcpArgs: ['@playwright/mcp@latest'],
      wsPort: config.mcp_ws_port || 3001,
      wsHost: config.mcp_ws_host || 'localhost',
      timeout: config.mcp_timeout || 30000,
      retryAttempts: config.mcp_retry_attempts || 3,
      ...config
    };
    
    this.mcpProcess = null;
    this.ws = null;
    this.connected = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Starts MCP server and establishes WebSocket connection
   * @returns {Promise<boolean>} - success status
   */
  async start() {
    try {
      console.log('🚀 Starting Playwright MCP server...');
      
      // Start MCP server process
      await this.startMcpServer();
      
      // Wait for server to be ready
      await this.waitForServerReady();
      
      // Connect WebSocket
      await this.connectWebSocket();
      
      console.log('✅ MCP client ready');
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to start MCP client: ${error.message}`);
      await this.cleanup();
      return false;
    }
  }

  /**
   * Starts the MCP server process
   * @returns {Promise<void>}
   */
  async startMcpServer() {
    return new Promise((resolve, reject) => {
      console.log(`📦 Spawning: ${this.config.mcpCommand} ${this.config.mcpArgs.join(' ')}`);
      
      this.mcpProcess = spawn(this.config.mcpCommand, this.config.mcpArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env,
          MCP_WS_PORT: this.config.wsPort.toString()
        }
      });

      let serverOutput = '';
      let errorOutput = '';

      this.mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.debug(`[MCP] ${output.trim()}`);
        
        // Check for server ready signals
        if (output.includes('WebSocket server') || output.includes('listening on')) {
          resolve();
        }
      });

      this.mcpProcess.stderr.on('data', (data) => {
        const error = data.toString();
        errorOutput += error;
        console.debug(`[MCP Error] ${error.trim()}`);
      });

      this.mcpProcess.on('error', (error) => {
        reject(new Error(`MCP process error: ${error.message}`));
      });

      this.mcpProcess.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`MCP process exited with code ${code}: ${errorOutput}`));
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!this.connected) {
          resolve(); // Try to connect anyway
        }
      }, 5000);
    });
  }

  /**
   * Waits for MCP server to be ready
   * @returns {Promise<void>}
   */
  async waitForServerReady() {
    const maxAttempts = 10;
    const delay = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Try to connect to check if server is ready
        const testWs = new WebSocket(`ws://${this.config.wsHost}:${this.config.wsPort}`);
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            testWs.close();
            reject(new Error('Connection timeout'));
          }, 2000);

          testWs.on('open', () => {
            clearTimeout(timeout);
            testWs.close();
            resolve();
          });

          testWs.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });

        console.log('🔗 MCP server is ready');
        return;

      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error(`MCP server not ready after ${maxAttempts} attempts: ${error.message}`);
        }
        
        console.log(`⏳ Waiting for MCP server... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Establishes WebSocket connection to MCP server
   * @returns {Promise<void>}
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.config.wsHost}:${this.config.wsPort}`;
      console.log(`🔌 Connecting to MCP WebSocket: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, this.config.timeout);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.connected = true;
        console.log('✅ WebSocket connected to MCP server');
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket error: ${error.message}`));
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.log('🔌 WebSocket connection closed');
      });
    });
  }

  /**
   * Handles incoming WebSocket messages
   * @param {Buffer} data - message data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        
        if (message.error) {
          reject(new Error(message.error.message || 'MCP request failed'));
        } else {
          resolve(message.result);
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse MCP message:', error.message);
    }
  }

  /**
   * Sends request to MCP server
   * @param {string} method - MCP method name
   * @param {Object} params - method parameters
   * @returns {Promise<any>} - response from MCP
   */
  async sendRequest(method, params = {}) {
    if (!this.connected) {
      throw new Error('MCP client not connected');
    }

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`MCP request timeout: ${method}`));
      }, this.config.timeout);

      // Clear timeout when request completes
      const originalResolve = resolve;
      const originalReject = reject;
      
      resolve = (result) => {
        clearTimeout(timeout);
        originalResolve(result);
      };
      
      reject = (error) => {
        clearTimeout(timeout);
        originalReject(error);
      };

      this.pendingRequests.set(id, { resolve, reject });

      try {
        this.ws.send(JSON.stringify(request));
        console.debug(`📤 MCP Request: ${method}`, params);
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(new Error(`Failed to send MCP request: ${error.message}`));
      }
    });
  }

  /**
   * Gets DOM snapshot from current page
   * @returns {Promise<Object>} - DOM snapshot data
   */
  async getSnapshot() {
    try {
      console.log('📸 Requesting DOM snapshot from MCP...');
      const snapshot = await this.sendRequest('browser_snapshot');
      
      if (snapshot && snapshot.elements) {
        console.log(`✅ DOM snapshot received: ${snapshot.elements.length} elements`);
        return snapshot;
      } else {
        throw new Error('Invalid snapshot format received');
      }
    } catch (error) {
      console.error(`❌ Failed to get DOM snapshot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Performs click action through MCP
   * @param {string} ref - element reference from snapshot
   * @returns {Promise<Object>} - action result
   */
  async browserClick(ref) {
    try {
      console.log(`🖱️  Performing click via MCP: ${ref}`);
      const result = await this.sendRequest('browser_click', { ref });
      console.log('✅ Click action completed');
      return result;
    } catch (error) {
      console.error(`❌ Click action failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Performs fill action through MCP
   * @param {string} ref - element reference from snapshot
   * @param {string} value - value to fill
   * @returns {Promise<Object>} - action result
   */
  async browserFill(ref, value) {
    try {
      console.log(`📝 Performing fill via MCP: ${ref} = "${value}"`);
      const result = await this.sendRequest('browser_fill', { ref, value });
      console.log('✅ Fill action completed');
      return result;
    } catch (error) {
      console.error(`❌ Fill action failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates suggested actions by executing them through MCP
   * @param {Array} actions - array of actions to validate
   * @returns {Promise<Object>} - validation results
   */
  async validateActions(actions) {
    const results = [];
    
    for (const action of actions) {
      try {
        let result;
        
        switch (action.type) {
          case 'click':
            result = await this.browserClick(action.ref);
            break;
          case 'fill':
            result = await this.browserFill(action.ref, action.value);
            break;
          default:
            throw new Error(`Unknown action type: ${action.type}`);
        }
        
        results.push({
          action,
          success: true,
          result
        });
        
      } catch (error) {
        results.push({
          action,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      totalActions: actions.length,
      successfulActions: results.filter(r => r.success).length,
      results
    };
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('🧹 Cleaning up MCP client...');
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Kill MCP process
    if (this.mcpProcess) {
      this.mcpProcess.kill('SIGTERM');
      
      // Force kill if needed
      setTimeout(() => {
        if (this.mcpProcess && !this.mcpProcess.killed) {
          this.mcpProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this.mcpProcess = null;
    }
    
    this.connected = false;
    this.pendingRequests.clear();
    
    console.log('✅ MCP client cleanup completed');
  }
}

export { McpClient }; 
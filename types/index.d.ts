/**
 * AI configuration for automatic debugging
 */
export interface AiConfig {
  /** API key for AI service (required) */
  api_key: string;
  
  /** AI server URL (default: 'https://api.openai.com/v1/chat/completions') */
  ai_server?: string;
  
  /** AI model for analysis (default: 'gpt-3.5-turbo') */
  model?: string;
  
  /** Test results folder (default: 'test-results') */
  results_dir?: string;
  
  /** HTML reports folder (default: 'playwright-report') */
  report_dir?: string;
  
  /** Maximum prompt length (default: 2000) */
  max_prompt_length?: number;
  
  /** Delay between requests in ms (default: 1000) */
  request_delay?: number;
  
  /** Error file patterns to search for (default: ['copy-prompt.txt', 'error-context.md', ...]) */
  error_file_patterns?: string[];
  
  /** Whether to save AI responses to Markdown files (default: false) */
  save_ai_responses?: boolean;
  
  /** Directory for saving AI responses (default: 'ai-responses') */
  ai_responses_dir?: string;
  
  /** Filename template for AI response files (default: 'ai-response-{timestamp}-{index}.md') */
  ai_response_filename_template?: string;
  
  /** Whether to include metadata in Markdown files (default: true) */
  include_metadata?: boolean;
  
  /** Enable Allure integration for AI responses (default: false) */
  allure_integration?: boolean;
  
  /** Directory for Allure results (default: 'allure-results') */
  allure_results_dir?: string;
  
  /** Enable MCP integration for DOM snapshots (default: false) */
  mcp_integration?: boolean;
  
  /** MCP WebSocket host (default: 'localhost') */
  mcp_ws_host?: string;
  
  /** MCP WebSocket port (default: 3001) */
  mcp_ws_port?: number;
  
  /** MCP request timeout in ms (default: 30000) */
  mcp_timeout?: number;
  
  /** MCP connection retry attempts (default: 3) */
  mcp_retry_attempts?: number;
  
  /** MCP server command (default: 'npx') */
  mcp_command?: string;
  
  /** MCP server arguments (default: ['@playwright/mcp@latest']) */
  mcp_args?: string[];
  
  /** Custom AI messages */
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

// Connect global types
import './global'; 
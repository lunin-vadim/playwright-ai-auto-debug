/**
 * AI configuration for automatic debugging
 */
export interface AiConfig {
  /** API key for AI service (required) */
  api_key: string;
  
  /** AI server URL (default: 'https://api.mistral.ai') */
  ai_server?: string;
  
  /** AI model for analysis (default: 'mistral-medium') */
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
  
  /** Custom AI messages */
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

// Connect global types
import './global'; 
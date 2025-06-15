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
  
  /** Custom AI messages */
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

// Connect global types
import './global'; 
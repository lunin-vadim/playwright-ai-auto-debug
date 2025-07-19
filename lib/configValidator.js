// lib/configValidator.js

import fs from 'fs';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Configuration validator with detailed checks and recommendations
 */
export class ConfigValidator {
  constructor(config) {
    this.config = config;
    this.errors = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Validate entire configuration
   */
  validate() {
    console.log('🔍 Validating configuration...');
    
    this.validateRequiredFields();
    this.validateApiConfiguration();
    this.validateDirectories();
    this.validatePerformanceSettings();
    this.validateMcpSettings();
    this.validateErrorPatterns();
    this.validateAllureSettings();
    this.generateRecommendations();

    return this.getValidationResult();
  }

  /**
   * Validate required fields
   */
  validateRequiredFields() {
    if (!this.config.api_key) {
      this.errors.push({
        field: 'api_key',
        message: 'API key is required',
        suggestion: 'Set api_key in your configuration or use environment variable API_KEY',
        severity: 'critical'
      });
    } else if (this.config.api_key === 'your-api-key-here') {
      this.warnings.push({
        field: 'api_key',
        message: 'Using default placeholder API key',
        suggestion: 'Replace with your actual API key or set API_KEY environment variable',
        severity: 'high'
      });
    }
  }

  /**
   * Validate API configuration
   */
  validateApiConfiguration() {
    // Validate AI server URL
    if (this.config.ai_server) {
      try {
        const url = new URL(this.config.ai_server);
        if (!['http:', 'https:'].includes(url.protocol)) {
          this.errors.push({
            field: 'ai_server',
            message: 'AI server URL must use HTTP or HTTPS protocol',
            suggestion: 'Use format: https://api.example.com',
            severity: 'high'
          });
        }
      } catch (error) {
        this.errors.push({
          field: 'ai_server',
          message: 'Invalid AI server URL format',
          suggestion: 'Use valid URL format: https://api.example.com',
          severity: 'high'
        });
      }
    }

    // Validate model
    if (!this.config.model) {
      this.warnings.push({
        field: 'model',
        message: 'AI model not specified',
        suggestion: 'Consider setting specific model (e.g., "mistral-medium", "gpt-4")',
        severity: 'medium'
      });
    }

    // Check for known providers and suggest optimal settings
    this.validateProviderSpecificSettings();
  }

  /**
   * Validate provider-specific settings
   */
  validateProviderSpecificSettings() {
    if (this.config.ai_server?.includes('mistral')) {
      if (!['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'].includes(this.config.model)) {
        this.recommendations.push({
          category: 'optimization',
          message: 'Consider using Mistral-specific model names',
          suggestion: 'Recommended: mistral-medium for balance of speed and quality',
          impact: 'medium'
        });
      }
    }

    if (this.config.ai_server?.includes('openai')) {
      if (this.config.request_delay < 1000) {
        this.recommendations.push({
          category: 'performance',
          message: 'OpenAI has rate limits',
          suggestion: 'Consider increasing request_delay to 1000ms or higher',
          impact: 'medium'
        });
      }
    }
  }

  /**
   * Validate directories
   */
  validateDirectories() {
    const directories = [
      { field: 'results_dir', path: this.config.results_dir, required: false },
      { field: 'report_dir', path: this.config.report_dir, required: false },
      { field: 'ai_responses_dir', path: this.config.ai_responses_dir, required: false },
      { field: 'allure_results_dir', path: this.config.allure_results_dir, required: false }
    ];

    directories.forEach(dir => {
      if (dir.path) {
        const fullPath = path.resolve(dir.path);
        
        // Check if directory exists
        if (!existsSync(fullPath)) {
          this.warnings.push({
            field: dir.field,
            message: `Directory does not exist: ${dir.path}`,
            suggestion: `Directory will be created automatically, or create manually: mkdir -p ${dir.path}`,
            severity: 'low'
          });
        }

        // Check write permissions
        if (existsSync(fullPath)) {
          try {
            fs.accessSync(fullPath, fs.constants.W_OK);
          } catch (error) {
            this.errors.push({
              field: dir.field,
              message: `No write permission for directory: ${dir.path}`,
              suggestion: `Fix permissions: chmod 755 ${dir.path}`,
              severity: 'high'
            });
          }
        }
      }
    });
  }

  /**
   * Validate performance settings
   */
  validatePerformanceSettings() {
    // Validate max_prompt_length
    if (this.config.max_prompt_length) {
      if (this.config.max_prompt_length < 500) {
        this.warnings.push({
          field: 'max_prompt_length',
          message: 'Very low prompt length may reduce AI analysis quality',
          suggestion: 'Recommended minimum: 1000 characters',
          severity: 'medium'
        });
      }

      if (this.config.max_prompt_length > 10000) {
        this.warnings.push({
          field: 'max_prompt_length',
          message: 'Very high prompt length may cause API errors',
          suggestion: 'Most providers limit context to 4000-8000 tokens',
          severity: 'medium'
        });
      }
    }

    // Validate request_delay
    if (this.config.request_delay !== undefined) {
      if (this.config.request_delay < 100) {
        this.warnings.push({
          field: 'request_delay',
          message: 'Very low request delay may trigger rate limits',
          suggestion: 'Recommended minimum: 500ms',
          severity: 'medium'
        });
      }

      if (this.config.request_delay > 10000) {
        this.recommendations.push({
          category: 'performance',
          message: 'High request delay will slow down processing',
          suggestion: 'Consider reducing delay if not hitting rate limits',
          impact: 'low'
        });
      }
    }
  }

  /**
   * Validate MCP settings
   */
  validateMcpSettings() {
    if (this.config.mcp_integration === true) {
      // MCP port validation
      if (this.config.mcp_ws_port) {
        if (this.config.mcp_ws_port < 1024 || this.config.mcp_ws_port > 65535) {
          this.errors.push({
            field: 'mcp_ws_port',
            message: 'Invalid MCP WebSocket port',
            suggestion: 'Use port between 1024-65535 (recommended: 3001)',
            severity: 'high'
          });
        }
      }

      // MCP timeout validation
      if (this.config.mcp_timeout && this.config.mcp_timeout < 5000) {
        this.warnings.push({
          field: 'mcp_timeout',
          message: 'Low MCP timeout may cause connection failures',
          suggestion: 'Recommended minimum: 10000ms (10 seconds)',
          severity: 'medium'
        });
      }

      // Check MCP command
      if (!this.config.mcp_command) {
        this.errors.push({
          field: 'mcp_command',
          message: 'MCP command not specified',
          suggestion: 'Set mcp_command to "npx" or full path to executable',
          severity: 'high'
        });
      }
    }
  }

  /**
   * Validate error file patterns
   */
  validateErrorPatterns() {
    if (this.config.error_file_patterns) {
      if (!Array.isArray(this.config.error_file_patterns)) {
        this.errors.push({
          field: 'error_file_patterns',
          message: 'Error file patterns must be an array',
          suggestion: 'Use array format: ["*.txt", "error-*.md"]',
          severity: 'high'
        });
      } else if (this.config.error_file_patterns.length === 0) {
        this.warnings.push({
          field: 'error_file_patterns',
          message: 'Empty error file patterns array',
          suggestion: 'Add patterns like "copy-prompt.txt", "*-error.md"',
          severity: 'medium'
        });
      }
    }
  }

  /**
   * Validate Allure settings
   */
  validateAllureSettings() {
    if (this.config.allure_integration === true) {
      if (!this.config.allure_results_dir) {
        this.warnings.push({
          field: 'allure_results_dir',
          message: 'Allure results directory not specified',
          suggestion: 'Set allure_results_dir (recommended: "allure-results")',
          severity: 'medium'
        });
      }

      // Check if Allure is properly configured in Playwright
      this.recommendations.push({
        category: 'integration',
        message: 'Ensure Playwright is configured with Allure reporter',
        suggestion: 'Add "@playwright/test/reporter/allure" to your playwright.config.js',
        impact: 'high'
      });
    }
  }

  /**
   * Generate additional recommendations
   */
  generateRecommendations() {
    // Security recommendations
    if (typeof this.config.api_key === 'string' && 
        !this.config.api_key.includes('process.env') && 
        this.config.api_key !== 'your-api-key-here') {
      this.recommendations.push({
        category: 'security',
        message: 'API key is hardcoded in configuration',
        suggestion: 'Use environment variable: process.env.API_KEY',
        impact: 'high'
      });
    }

    // Performance recommendations
    if (!this.config.save_ai_responses) {
      this.recommendations.push({
        category: 'debugging',
        message: 'AI responses are not being saved',
        suggestion: 'Enable save_ai_responses for debugging and audit purposes',
        impact: 'medium'
      });
    }

    // Feature recommendations
    if (!this.config.allure_integration) {
      this.recommendations.push({
        category: 'features',
        message: 'Allure integration disabled',
        suggestion: 'Enable Allure integration for better reporting and test management',
        impact: 'medium'
      });
    }

    if (this.config.mcp_integration === undefined) {
      this.recommendations.push({
        category: 'features',
        message: 'MCP integration not configured',
        suggestion: 'Consider enabling MCP for better DOM snapshot analysis',
        impact: 'low'
      });
    }
  }

  /**
   * Get validation result
   */
  getValidationResult() {
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;
    
    return {
      valid: !hasErrors,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.recommendations,
      summary: {
        total_issues: this.errors.length + this.warnings.length,
        critical_errors: this.errors.filter(e => e.severity === 'critical').length,
        high_priority: this.errors.filter(e => e.severity === 'high').length + 
                      this.warnings.filter(w => w.severity === 'high').length,
        medium_priority: this.warnings.filter(w => w.severity === 'medium').length,
        recommendations_count: this.recommendations.length
      }
    };
  }

  /**
   * Print validation results to console
   */
  printResults() {
    const result = this.getValidationResult();
    
    console.log('\n📊 Configuration Validation Results');
    console.log('═'.repeat(50));

    if (result.valid) {
      console.log('✅ Configuration is valid!');
    } else {
      console.log('❌ Configuration has errors that need to be fixed');
    }

    console.log(`📋 Summary: ${result.summary.total_issues} issues found`);
    console.log(`   🔴 Critical: ${result.summary.critical_errors}`);
    console.log(`   🟡 High Priority: ${result.summary.high_priority}`);
    console.log(`   🟠 Medium Priority: ${result.summary.medium_priority}`);
    console.log(`   💡 Recommendations: ${result.summary.recommendations_count}`);

    // Print errors
    if (result.errors.length > 0) {
      console.log('\n🚨 ERRORS (must be fixed):');
      result.errors.forEach((error, index) => {
        const icon = error.severity === 'critical' ? '🔴' : '🟡';
        console.log(`${icon} ${index + 1}. ${error.field}: ${error.message}`);
        console.log(`   💡 ${error.suggestion}`);
      });
    }

    // Print warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (should be addressed):');
      result.warnings.forEach((warning, index) => {
        const icon = warning.severity === 'high' ? '🟡' : '🟠';
        console.log(`${icon} ${index + 1}. ${warning.field}: ${warning.message}`);
        console.log(`   💡 ${warning.suggestion}`);
      });
    }

    // Print recommendations
    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      
      const grouped = this.groupRecommendationsByCategory(result.recommendations);
      
      Object.entries(grouped).forEach(([category, recs]) => {
        console.log(`\n🏷️  ${category.toUpperCase()}:`);
        recs.forEach((rec, index) => {
          const icon = rec.impact === 'high' ? '🔥' : rec.impact === 'medium' ? '📈' : '💭';
          console.log(`${icon} ${rec.message}`);
          console.log(`   → ${rec.suggestion}`);
        });
      });
    }

    console.log('\n' + '═'.repeat(50));
    
    if (result.valid) {
      console.log('🎉 Your configuration looks great! Ready to debug tests.');
    } else {
      console.log('🔧 Please fix the errors above and run validation again.');
    }

    return result;
  }

  /**
   * Group recommendations by category
   */
  groupRecommendationsByCategory(recommendations) {
    return recommendations.reduce((groups, rec) => {
      const category = rec.category || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rec);
      return groups;
    }, {});
  }
}

/**
 * Validate configuration and print results
 */
export async function validateConfiguration(config) {
  const validator = new ConfigValidator(config);
  return validator.printResults();
}

/**
 * Quick validation without detailed output
 */
export function quickValidate(config) {
  const validator = new ConfigValidator(config);
  const result = validator.validate();
  return result.valid;
} 
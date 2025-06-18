import { findPromptFiles } from './extractPrompts.js';
import { sendToAI, saveResponseToMarkdown, createAllureAttachment } from './sendToAI.js';
import { updateHtmlReport } from './updateHtml.js';
import { loadAiConfig } from './config.js';
import { McpClient } from './mcpClient.js';
import { parseActions, convertToMcpActions, validateActions } from './actionParser.js';

/**
 * Main function for automatic Playwright test debugging
 * @param {string} projectRoot - project root folder (defaults to current)
 * @param {Object} options - CLI options including useMcp flag
 */
async function debugPlaywrightTests(projectRoot = process.cwd(), options = {}) {
  let processedCount = 0;
  let errorCount = 0;
  let mcpClient = null;
  
  try {
    // Сохраняем текущую директорию и переходим в проект
    const originalCwd = process.cwd();
    
    if (projectRoot !== process.cwd()) {
      process.chdir(projectRoot);
      console.log(`📁 Working in project directory: ${projectRoot}`);
    }
    
    try {
      // 0. Load AI configuration
      console.log('⚙️  Loading AI configuration...');
      const config = await loadAiConfig();
      
      // Enable MCP integration if requested
      if (options.useMcp) {
        config.mcp_integration = true;
        console.log('🔗 MCP integration enabled via CLI flag');
      }
      
      // 0.1. Initialize MCP client if enabled
      if (config.mcp_integration) {
        mcpClient = new McpClient(config);
        const mcpStarted = await mcpClient.start();
        
        if (!mcpStarted) {
          console.warn('⚠️  MCP client failed to start, falling back to standard mode');
          config.mcp_integration = false;
          mcpClient = null;
        }
      }
      
      // 1. Find all prompt files
      console.log('🔍 Searching for error files...');
      const prompts = await findPromptFiles(config);
      
      if (prompts.length === 0) {
        console.log('ℹ️  No error files found');
        return { success: true, processed: 0, errors: 0 };
      }
      
      console.log(`📋 Found ${prompts.length} error file(s)\n`);
      
      // 2. Process each prompt
      for (let i = 0; i < prompts.length; i++) {
        const { path, content, htmlPath } = prompts[i];
        
        console.log(`\n📝 Processing ${i + 1}/${prompts.length}: ${path}`);
        
        try {
          // Limit prompt size to save tokens
          const maxLength = config.max_prompt_length || 2000;
          const truncatedContent = content.length > maxLength 
            ? content.substring(0, maxLength) + '\n...(content truncated)'
            : content;
          
          console.log(`📊 Content length: ${content.length} chars${content.length > maxLength ? ' (truncated to ' + maxLength + ')' : ''}`);
          console.log(`🎯 Using model: ${config.model}`);
          
          // 2.1. Get DOM snapshot if MCP is enabled
          let domSnapshot = null;
          if (mcpClient) {
            try {
              domSnapshot = await mcpClient.getSnapshot();
              console.log(`📸 DOM snapshot included: ${domSnapshot.elements?.length || 0} elements`);
            } catch (error) {
              console.warn(`⚠️  Failed to get DOM snapshot: ${error.message}`);
            }
          }
          
          // 3. Send to AI (with optional DOM snapshot)
          const solution = await sendToAI(truncatedContent, config, domSnapshot);
          
          if (!solution) {
            console.log('⚠️  Empty response from AI');
            errorCount++;
            continue;
          }
          
          // 3.1. Validate AI solution through MCP if enabled
          let validatedSolution = solution;
          if (mcpClient && domSnapshot) {
            try {
              console.log('🔍 Parsing actions from AI response...');
              const parsedActions = parseActions(solution);
              
              if (parsedActions.length > 0) {
                console.log(`📋 Found ${parsedActions.length} potential actions`);
                
                // Validate actions for safety
                const validation = validateActions(parsedActions);
                if (validation.warnings.length > 0) {
                  console.warn('⚠️  Action validation warnings:', validation.warnings);
                }
                
                if (validation.valid && validation.filteredActions.length > 0) {
                  // Convert to MCP format
                  const mcpActions = convertToMcpActions(validation.filteredActions, domSnapshot);
                  
                  if (mcpActions.length > 0) {
                    console.log(`🧪 Validating ${mcpActions.length} actions through MCP...`);
                    
                    // Execute actions through MCP for validation
                    const validationResults = await mcpClient.validateActions(mcpActions);
                    
                    const successRate = validationResults.successfulActions / validationResults.totalActions;
                    console.log(`✅ MCP validation: ${validationResults.successfulActions}/${validationResults.totalActions} actions successful (${Math.round(successRate * 100)}%)`);
                    
                    // Enhance solution with validation results
                    validatedSolution += `\n\n## 🧪 MCP Validation Results\n`;
                    validatedSolution += `- **Actions tested:** ${validationResults.totalActions}\n`;
                    validatedSolution += `- **Successful:** ${validationResults.successfulActions}\n`;
                    validatedSolution += `- **Success rate:** ${Math.round(successRate * 100)}%\n`;
                    
                    if (successRate >= 0.8) {
                      validatedSolution += `\n✅ **High confidence:** Actions validated successfully through MCP\n`;
                    } else if (successRate >= 0.5) {
                      validatedSolution += `\n⚠️  **Medium confidence:** Some actions may need adjustment\n`;
                    } else {
                      validatedSolution += `\n❌ **Low confidence:** Actions may not work as expected\n`;
                    }
                  } else {
                    console.log('ℹ️  No MCP-compatible actions found');
                  }
                } else {
                  console.warn('⚠️  Action validation failed, skipping MCP validation');
                  if (validation.errors.length > 0) {
                    console.warn('❌ Validation errors:', validation.errors);
                  }
                }
              } else {
                console.log('ℹ️  No actionable commands found in AI response');
              }
            } catch (error) {
              console.warn(`⚠️  MCP validation failed: ${error.message}`);
            }
          }
          
          // 4. Save AI response to Markdown (if enabled)
          saveResponseToMarkdown(validatedSolution, truncatedContent, config, i);
          
          // 5. Create Allure attachment (if enabled)
          await createAllureAttachment(validatedSolution, truncatedContent, config, i, path);
          
          // 6. Update HTML report
          console.log(`📄 Updating HTML report: ${htmlPath}`);
          await updateHtmlReport(htmlPath, truncatedContent, validatedSolution);
          processedCount++;
          console.log(`✅ Successfully processed file ${i + 1}/${prompts.length}`);
          
          // Small delay between requests to respect rate limits
          if (i < prompts.length - 1) {
            const delay = config.request_delay || 1000;
            console.log(`⏳ Waiting ${delay}ms before next request...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (error) {
          errorCount++;
          
          // Enhanced error handling with specific messages
          if (error.message.includes('429')) {
            console.error(`❌ Rate limit exceeded for ${path}`);
            console.error('💡 Try increasing request_delay in your configuration or wait before retrying');
          } else if (error.message.includes('401') || error.message.includes('403')) {
            console.error(`❌ Authentication error for ${path}: Check your API key`);
          } else if (error.message.includes('API')) {
            console.error(`❌ AI API error for ${path}: ${error.message}`);
          } else {
            console.error(`❌ Error processing ${path}: ${error.message}`);
          }
          continue;
        }
      }
      
      // Final status summary
      console.log(`\n📊 Processing Summary:`);
      console.log(`   ✅ Successfully processed: ${processedCount}/${prompts.length}`);
      if (errorCount > 0) {
        console.log(`   ❌ Errors encountered: ${errorCount}/${prompts.length}`);
      }
      
      return { 
        success: errorCount === 0, 
        processed: processedCount, 
        errors: errorCount,
        total: prompts.length
      };
      
    } finally {
      // Cleanup MCP client
      if (mcpClient) {
        await mcpClient.cleanup();
      }
      
      // Возвращаемся в исходную директорию
      if (projectRoot !== originalCwd) {
        process.chdir(originalCwd);
      }
    }
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
    throw error;
  }
}

export { debugPlaywrightTests }; 
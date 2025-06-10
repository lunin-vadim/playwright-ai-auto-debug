import { findPromptFiles } from './extractPrompts.js';
import { sendToAI } from './sendToAI.js';
import { updateHtmlReport } from './updateHtml.js';
import { loadAiConfig } from './config.js';

/**
 * Main function for automatic Playwright test debugging
 * @param {string} projectRoot - project root folder (defaults to current)
 */
async function debugPlaywrightTests(projectRoot = process.cwd()) {
  try {
    // 0. Load AI configuration
    console.log('⚙️  Loading AI configuration...');
    const config = await loadAiConfig(projectRoot);
    
    // 1. Find all prompt files
    console.log('🔍 Searching for error files...');
    const prompts = await findPromptFiles(config);
    
    if (prompts.length === 0) {
      console.log('ℹ️  No error files found');
      return;
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
        
        // 3. Send to AI
        const solution = await sendToAI(truncatedContent, config);
        
        if (!solution) {
          console.log('⚠️  Empty response from AI');
          continue;
        }
        
        // 4. Update HTML report
        await updateHtmlReport(htmlPath, truncatedContent, solution);
        
        // Small delay between requests to respect rate limits
        if (i < prompts.length - 1) {
          const delay = config.request_delay || 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${path}:`, error.message);
        continue;
      }
    }
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
    throw error;
  }
}

export { debugPlaywrightTests }; 
import { findPromptFiles } from './extractPrompts.js';
import { sendToAI } from './sendToAI.js';
import { updateHtmlReport } from './updateHtml.js';
import { loadAiConfig } from './config.js';

/**
 * Main function for automatic Playwright test debugging
 * @param {string} projectRoot - project root folder (defaults to current)
 */
async function debugPlaywrightTests(projectRoot = process.cwd()) {
  let processedCount = 0;
  let errorCount = 0;
  
  try {
    // 0. Load AI configuration
    console.log('⚙️  Loading AI configuration...');
    const config = await loadAiConfig();
    
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
        
        // 3. Send to AI
        const solution = await sendToAI(truncatedContent, config);
        
        if (!solution) {
          console.log('⚠️  Empty response from AI');
          errorCount++;
          continue;
        }
        
        // 4. Update HTML report
        console.log(`📄 Updating HTML report: ${htmlPath}`);
        await updateHtmlReport(htmlPath, truncatedContent, solution);
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
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
    throw error;
  }
}

export { debugPlaywrightTests }; 
import { readFile, writeFile, access } from 'fs/promises';
import * as cheerio from 'cheerio';

/**
 * Updates HTML report by adding AI debugging block
 * @param {string} htmlPath - path to HTML file
 * @param {string} error - error text
 * @param {string} solution - solution from AI
 */
async function updateHtmlReport(htmlPath, error, solution) {
  try {
    // Check if HTML file exists
    await access(htmlPath);
  } catch {
    console.log(`⚠️  HTML file not found: ${htmlPath}`);
    return;
  }
  
  try {
    const htmlContent = await readFile(htmlPath, 'utf-8');
    const $ = cheerio.load(htmlContent);
    
    // Remove existing AI debug block if present
    $('.ai-debug-section').remove();
    
    // Create styles compatible with Playwright
    const aiStyles = `
      <style>
        .ai-debug-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 1rem 0;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          border-left: 4px solid #667eea;
        }
        
        .ai-debug-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 1.5rem;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .ai-debug-content {
          padding: 1.5rem;
        }
        
        .ai-error-section {
          margin-bottom: 1.5rem;
        }
        
        .ai-section-title {
          margin: 0 0 0.75rem 0;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #dc3545;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .ai-solution-title {
          color: #28a745;
        }
        
        .ai-error-details {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          padding: 1rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          color: #721c24;
          white-space: pre-wrap;
          line-height: 1.4;
          overflow-x: auto;
        }
        
        .ai-solution-content {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          padding: 1rem;
          font-size: 0.875rem;
          color: #155724;
          line-height: 1.6;
          border-left: 4px solid #28a745;
        }
        
        .ai-solution-content p {
          margin: 0 0 0.75rem 0;
        }
        
        .ai-solution-content p:last-child {
          margin-bottom: 0;
        }
        
        .ai-solution-content code {
          background: rgba(0,0,0,0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.8em;
        }
        
        .ai-solution-content pre {
          background: rgba(0,0,0,0.05);
          padding: 0.75rem;
          border-radius: 4px;
          margin: 0.5rem 0;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.8em;
        }
        
        @media (max-width: 768px) {
          .ai-debug-content {
            padding: 1rem;
          }
          
          .ai-debug-header {
            padding: 0.75rem 1rem;
            font-size: 1.1rem;
          }
        }
      </style>
    `;
    
    // Add styles to head if not already present
    if (!$('head').html().includes('ai-debug-section')) {
      $('head').append(aiStyles);
    }
    
    // Format AI solution for better display
    const formattedSolution = formatAiSolution(solution);
    
    // Create new AI debugging block in Playwright style
    const aiDebugHtml = `
      <div class="ai-debug-section">
        <h2 class="ai-debug-header">
          🤖 AI Debug Assistant
        </h2>
        <div class="ai-debug-content">
          <div class="ai-error-section">
            <div class="ai-section-title">
              ❌ Detected Error
            </div>
            <div class="ai-error-details">${escapeHtml(error)}</div>
          </div>
          <div class="ai-solution-section">
            <div class="ai-section-title ai-solution-title">
              💡 Recommended Solution
            </div>
            <div class="ai-solution-content">${formattedSolution}</div>
          </div>
        </div>
      </div>
    `;
    
    // Find suitable place to insert the block
    const insertionPoint = findInsertionPoint($);
    
    if (insertionPoint.length > 0) {
      insertionPoint.after(aiDebugHtml);
    } else {
      // Fallback: insert at the end of container or body
      if ($('.container').length > 0) {
        $('.container').append(aiDebugHtml);
      } else if ($('body').length > 0) {
        $('body').append(aiDebugHtml);
      } else {
        $('html').append(aiDebugHtml);
      }
    }
    
    // Save updated HTML
    await writeFile(htmlPath, $.html(), 'utf-8');
    console.log(`💾 HTML updated: ${htmlPath}`);
    
  } catch (error) {
    console.error(`❌ Error updating HTML ${htmlPath}:`, error.message);
  }
}

/**
 * Escapes HTML characters
 * @param {string} text - text to escape
 * @returns {string} - escaped text
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats AI solution for better HTML display
 * @param {string} solution - solution from AI
 * @returns {string} - formatted solution
 */
function formatAiSolution(solution) {
  // Escape HTML
  let formatted = escapeHtml(solution);
  
  // Replace line breaks with paragraphs
  formatted = formatted
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
  
  // Process code in backticks
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Process code blocks
  formatted = formatted.replace(/```([^`]+)```/g, '<pre>$1</pre>');
  
  // If no paragraphs, create one
  if (!formatted.includes('<p>')) {
    formatted = `<p>${formatted}</p>`;
  }
  
  return formatted;
}

/**
 * Finds suitable place to insert AI block in HTML report
 * @param {CheerioAPI} $ - cheerio object
 * @returns {Cheerio} - element after which to insert the block
 */
function findInsertionPoint($) {
  // Priority places for insertion (in order of preference)
  const selectors = [
    '.test-results',           // Test results block
    '.summary',                // Summary information block
    '.test-item:last-child',   // Last test
    '.container > *:last-child', // Last element in container
    'main > *:last-child',     // Last element in main
    'body > *:last-child'      // Last element in body
  ];
  
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length > 0) {
      return element.last();
    }
  }
  
  return $(); // Return empty object if nothing found
}

export { updateHtmlReport }; 
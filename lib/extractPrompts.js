import { readdir, readFile, stat } from 'fs/promises';
import { join, dirname } from 'path';

/**
 * Checks if file is an error file
 * @param {string} filename - file name
 * @param {Array<string>} patterns - file patterns to search for
 * @returns {boolean}
 */
function isErrorFile(filename, patterns) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      // Simple wildcard support
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  });
}

/**
 * Searches for HTML report in various possible locations
 * @param {string} errorFilePath - path to error file
 * @param {Object} config - AI configuration
 * @returns {Promise<string>} - path to HTML report
 */
async function findHtmlReport(errorFilePath, config) {
  const reportDir = config.report_dir || 'playwright-report';
  const resultsDir = config.results_dir || 'test-results';
  
  // Possible paths to HTML report (in priority order)
  const possiblePaths = [
    // 1. In playwright-report folder (standard location)
    join(reportDir, 'index.html'),
    
    // 2. In project root
    'index.html',
    
    // 3. In test results folder
    join(resultsDir, 'index.html'),
    
    // 4. In the same folder as error file
    join(dirname(errorFilePath), 'index.html'),
    
    // 5. In parent folder of error file
    join(dirname(dirname(errorFilePath)), 'index.html'),
    
    // 6. Alternative names in playwright-report
    join(reportDir, 'report.html'),
    join(reportDir, 'test-report.html')
  ];
  
  // Check each possible path
  for (const htmlPath of possiblePaths) {
    try {
      await stat(htmlPath);
      console.log(`📄 Found HTML report: ${htmlPath}`);
      return htmlPath;
    } catch {
      // File doesn't exist, continue searching
    }
  }
  
  // If nothing found, return default path
  const defaultPath = join(reportDir, 'index.html');
  console.log(`⚠️  HTML report not found, will use: ${defaultPath}`);
  return defaultPath;
}

/**
 * Recursively searches for error files in results directory
 * @param {Object} config - AI configuration with results path
 * @returns {Promise<Array<{path: string, content: string, htmlPath: string}>>}
 */
async function findPromptFiles(config) {
  const dir = config.results_dir || 'test-results';
  
  // File patterns to search for (configurable)
  const errorFilePatterns = config.error_file_patterns || [
    'copy-prompt.txt',      // Standard Playwright file
    'error-context.md',     // Alternative format
    'error.txt',            // Simple text file
    'test-error.md',        // Markdown with error
    '*-error.txt',          // Files ending with -error.txt
    '*-error.md'            // Files ending with -error.md
  ];
  
  const prompts = [];
  
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively search in subfolders
        const subPrompts = await findPromptFilesRecursive(fullPath, errorFilePatterns, config);
        prompts.push(...subPrompts);
      } else if (isErrorFile(entry, errorFilePatterns)) {
        // Found error file
        const content = await readFile(fullPath, 'utf-8');
        
        // Search for HTML report
        const htmlPath = await findHtmlReport(fullPath, config);
        
        prompts.push({
          path: fullPath,
          content: content.trim(),
          htmlPath,
          fileType: entry.split('.').pop() // file extension
        });
        
        console.log(`✅ Found error file: ${fullPath}`);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  Folder ${dir} not found`);
      return [];
    }
    throw error;
  }
  
  return prompts;
}

/**
 * Helper function for recursive search in subfolders
 * @param {string} dir - directory to search in
 * @param {Array<string>} errorFilePatterns - file patterns to search for
 * @param {Object} config - AI configuration
 * @returns {Promise<Array<{path: string, content: string, htmlPath: string}>>}
 */
async function findPromptFilesRecursive(dir, errorFilePatterns, config) {
  const prompts = [];
  
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively search in subfolders
        const subPrompts = await findPromptFilesRecursive(fullPath, errorFilePatterns, config);
        prompts.push(...subPrompts);
      } else if (isErrorFile(entry, errorFilePatterns)) {
        // Found error file
        const content = await readFile(fullPath, 'utf-8');
        
        // Search for HTML report
        const htmlPath = await findHtmlReport(fullPath, config);
        
        prompts.push({
          path: fullPath,
          content: content.trim(),
          htmlPath,
          fileType: entry.split('.').pop() // file extension
        });
        
        console.log(`✅ Found error file: ${fullPath}`);
      }
    }
  } catch (error) {
    // Ignore access errors for individual folders
    console.log(`⚠️  Could not read folder: ${dir}`);
  }
  
  return prompts;
}

export { findPromptFiles }; 
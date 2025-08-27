// src/infrastructure/legacy/LegacyExtractPrompts.js

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Временная заглушка для старого модуля extractPrompts
 * TODO: Реализовать новый ErrorRepository в рамках Clean Architecture
 */

export async function findPromptFiles(config) {
  console.log('🔍 Finding test error files...');
  
  try {
    const resultsDir = config.results_dir || 'test-results';
    const patterns = config.error_file_patterns || ['**/error-context.md', 'copy-prompt.txt', 'error.txt'];
    
    const files = [];
    
    for (const pattern of patterns) {
      let fullPattern;
      
      // Если паттерн начинается с **/, то это глобальный поиск
      if (pattern.startsWith('**/')) {
        // Ищем везде, начиная с resultsDir
        fullPattern = path.join(resultsDir, pattern);
      } else if (pattern.includes('*')) {
        // Паттерн с wildcard - ищем в resultsDir
        fullPattern = path.join(resultsDir, '**', pattern);
      } else {
        // Простое имя файла - ищем рекурсивно в resultsDir
        fullPattern = path.join(resultsDir, '**', pattern);
      }
      
      console.log(`🔍 Searching with pattern: ${fullPattern}`);
      const matchedFiles = await glob(fullPattern, { 
        cwd: process.cwd(),
        absolute: true,
        ignore: ['**/node_modules/**'] 
      });
      
      console.log(`📁 Found ${matchedFiles.length} files with pattern: ${pattern}`);
      files.push(...matchedFiles);
    }
    
    // Фильтруем только существующие файлы
    const existingFiles = files.filter(file => {
      try {
        return fs.existsSync(file) && fs.statSync(file).isFile();
      } catch {
        return false;
      }
    });
    
    console.log(`📁 Found ${existingFiles.length} potential error files`);
    
    // Читаем реальное содержимое файлов
    const fileContents = [];
    for (const filePath of existingFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        fileContents.push({
          path: filePath,
          content,
          errorType: 'test_failure',
          testName: path.basename(filePath, path.extname(filePath))
        });
      } catch (error) {
        console.warn(`⚠️  Could not read file ${filePath}:`, error.message);
      }
    }
    
    return fileContents;
    
  } catch (error) {
    console.error('❌ Error finding files:', error.message);
    return [];
  }
} 
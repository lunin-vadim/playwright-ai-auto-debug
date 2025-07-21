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
    const patterns = config.error_file_patterns || ['**/*.json', '**/*.html'];
    
    const files = [];
    
    for (const pattern of patterns) {
      let fullPattern;
      if (pattern.startsWith('**/')) {
        // Паттерн уже содержит путь относительно resultsDir
        fullPattern = path.join(resultsDir, pattern);
      } else {
        // Обычный паттерн файла
        fullPattern = path.join(resultsDir, pattern);
      }
      
      console.log(`🔍 Searching with pattern: ${fullPattern}`);
      const matchedFiles = await glob(fullPattern, { 
        cwd: process.cwd(),
        absolute: true 
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
    
    // Возвращаем в формате, ожидаемом старой системой
    return existingFiles.map(filePath => ({
      filePath,
      content: `Mock error content for ${path.basename(filePath)}`,
      errorType: 'test_failure',
      testName: path.basename(filePath, path.extname(filePath))
    }));
    
  } catch (error) {
    console.error('❌ Error finding files:', error.message);
    return [];
  }
} 
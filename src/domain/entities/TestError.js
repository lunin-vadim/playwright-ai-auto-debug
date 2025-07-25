// src/domain/entities/TestError.js

/**
 * Доменная сущность - Ошибка теста
 * Содержит всю информацию об ошибке и бизнес-логику для её анализа
 */
export class TestError {
  constructor(filePath, content, errorType, testName) {
    if (!filePath || !content) {
      throw new Error('TestError requires filePath and content');
    }
    
    this.filePath = filePath;
    this.content = content;
    this.errorType = errorType || this.detectErrorType();
    this.testName = testName || this.extractTestName();
    this.timestamp = new Date();
    this.id = this.generateId();
    this.keywords = this.extractKeywords();
    this.severity = this.getErrorSeverity();
  }

  /**
   * Генерирует уникальный идентификатор ошибки
   * @returns {string}
   */
  generateId() {
    const hash = this.hashString(this.filePath + this.content);
    return `error_${hash}_${this.timestamp.getTime()}`;
  }

  /**
   * Извлекает ключевые слова из содержимого ошибки
   * @returns {string[]}
   */
  extractKeywords() {
    const keywords = new Set();
    
    // Извлечение из стек-трейса
    const stackTraceMatches = this.content.match(/at\s+([^(]+)/g) || [];
    stackTraceMatches.forEach(match => {
      const functionName = match.replace(/at\s+/, '').split('.')[0];
      if (functionName && functionName.length > 2) {
        keywords.add(functionName.toLowerCase());
      }
    });

    // Извлечение селекторов
    const selectorMatches = this.content.match(/getBy\w+\(['"`]([^'"`]+)['"`]\)/g) || [];
    selectorMatches.forEach(match => {
      const selector = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
      if (selector) {
        keywords.add(selector.toLowerCase());
      }
    });

    // Извлечение имен тестов
    const testMatches = this.content.match(/test\(['"`]([^'"`]+)['"`]/g) || [];
    testMatches.forEach(match => {
      const testName = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
      if (testName) {
        testName.split(/\s+/).forEach(word => {
          if (word.length > 2) {
            keywords.add(word.toLowerCase());
          }
        });
      }
    });

    // Извлечение URL и путей
    const urlMatches = this.content.match(/https?:\/\/[^\s'"]+/g) || [];
    urlMatches.forEach(url => {
      const path = url.split('/').pop();
      if (path && path.length > 2) {
        keywords.add(path.toLowerCase());
      }
    });

    return Array.from(keywords);
  }

  /**
   * Определяет тип ошибки на основе содержимого
   * @returns {string}
   */
  detectErrorType() {
    const content = this.content.toLowerCase();
    
    if (content.includes('timeout') || content.includes('waiting')) {
      return 'TIMEOUT';
    }
    if (content.includes('element not found') || content.includes('locator')) {
      return 'ELEMENT_NOT_FOUND';
    }
    if (content.includes('assertion') || content.includes('expect')) {
      return 'ASSERTION';
    }
    if (content.includes('network') || content.includes('connection')) {
      return 'NETWORK';
    }
    if (content.includes('permission') || content.includes('access')) {
      return 'PERMISSION';
    }
    if (content.includes('javascript error') || content.includes('uncaught')) {
      return 'JAVASCRIPT';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Извлекает имя теста из пути файла или содержимого
   * @returns {string}
   */
  extractTestName() {
    // Из пути файла
    const fileName = this.filePath.split('/').pop();
    const baseName = fileName.replace(/\.(js|ts|spec|test).*$/g, '');
    
    // Из содержимого (ищем test('...'))
    const testMatch = this.content.match(/test\(['"`]([^'"`]+)['"`]/);
    if (testMatch) {
      return testMatch[1];
    }
    
    // Из содержимого (ищем describe('...'))
    const describeMatch = this.content.match(/describe\(['"`]([^'"`]+)['"`]/);
    if (describeMatch) {
      return describeMatch[1];
    }
    
    return baseName;
  }

  /**
   * Определяет серьезность ошибки
   * @returns {string}
   */
  getErrorSeverity() {
    const criticalKeywords = ['crash', 'fatal', 'critical', 'security'];
    const highKeywords = ['timeout', 'assertion', 'element not found'];
    const mediumKeywords = ['network', 'permission'];
    
    const content = this.content.toLowerCase();
    
    if (criticalKeywords.some(keyword => content.includes(keyword))) {
      return 'CRITICAL';
    }
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return 'HIGH';
    }
    if (mediumKeywords.some(keyword => content.includes(keyword))) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Проверяет, можно ли повторить тест после исправления
   * @returns {boolean}
   */
  isRetryable() {
    const nonRetryableTypes = ['ASSERTION', 'JAVASCRIPT'];
    return !nonRetryableTypes.includes(this.errorType);
  }

  /**
   * Проверяет, связана ли ошибка с конкретным тестом
   * @param {string} testName - имя теста для проверки
   * @returns {number} - коэффициент релевантности (0-1)
   */
  getRelevanceScore(testName) {
    if (!testName) return 0;
    
    let score = 0;
    const normalizedTestName = testName.toLowerCase();
    
    // Точное совпадение имени теста
    if (this.testName.toLowerCase() === normalizedTestName) {
      score += 0.5;
    }
    
    // Совпадение ключевых слов
    const testWords = normalizedTestName.split(/\s+/);
    const matchingKeywords = this.keywords.filter(keyword => 
      testWords.some(word => word.includes(keyword) || keyword.includes(word))
    );
    
    score += (matchingKeywords.length / Math.max(this.keywords.length, testWords.length)) * 0.3;
    
    // Совпадение в пути файла
    if (this.filePath.toLowerCase().includes(normalizedTestName.replace(/\s+/g, '-'))) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  /**
   * Возвращает краткое описание ошибки
   * @returns {string}
   */
  getSummary() {
    const lines = this.content.split('\n');
    const errorLine = lines.find(line => 
      line.includes('Error:') || 
      line.includes('Failed:') || 
      line.includes('AssertionError')
    );
    
    if (errorLine) {
      return errorLine.trim().substring(0, 100) + '...';
    }
    
    return lines[0]?.trim().substring(0, 100) + '...' || 'Unknown error';
  }

  /**
   * Проверяет, содержит ли ошибка информацию о DOM элементах
   * @returns {boolean}
   */
  hasDomContext() {
    const domKeywords = ['selector', 'element', 'locator', 'getBy', 'querySelector'];
    return domKeywords.some(keyword => 
      this.content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Простая хеш-функция для генерации ID
   * @param {string} str 
   * @returns {string}
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Сериализация для JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      filePath: this.filePath,
      content: this.content,
      errorType: this.errorType,
      testName: this.testName,
      timestamp: this.timestamp,
      keywords: this.keywords,
      severity: this.severity,
      summary: this.getSummary()
    };
  }

  /**
   * Создание из JSON
   * @param {Object} json 
   * @returns {TestError}
   */
  static fromJSON(json) {
    const error = new TestError(json.filePath, json.content, json.errorType, json.testName);
    error.id = json.id;
    error.timestamp = new Date(json.timestamp);
    return error;
  }
} 
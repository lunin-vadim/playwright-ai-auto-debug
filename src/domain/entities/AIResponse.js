// src/domain/entities/AIResponse.js

/**
 * Доменная сущность - Ответ ИИ
 * Содержит ответ ИИ и методы для его анализа и обработки
 */
export class AIResponse {
  constructor(content, testError, metadata = {}) {
    if (!content || !testError) {
      throw new Error('AIResponse requires content and testError');
    }
    
    this.content = content;
    this.testError = testError;
    this.metadata = {
      model: 'unknown',
      provider: 'unknown',
      timestamp: new Date(),
      processingTime: 0,
      confidence: 0.5,
      ...metadata
    };
    
    this.id = this.generateId();
    this.actions = this.extractActions();
    this.recommendations = this.extractRecommendations();
    this.codeSnippets = this.extractCodeSnippets();
    this.confidence = this.calculateConfidence();
  }

  /**
   * Генерирует уникальный идентификатор ответа
   * @returns {string}
   */
  generateId() {
    const hash = this.hashString(this.content + this.testError.id);
    return `response_${hash}_${this.metadata.timestamp.getTime()}`;
  }

  /**
   * Извлекает действия из ответа ИИ
   * @returns {Object[]}
   */
  extractActions() {
    const actions = [];
    const lines = this.content.split('\n');
    
    for (const line of lines) {
      // Поиск Playwright действий
      const clickMatch = line.match(/(?:await\s+)?page\.(?:getBy\w+\([^)]+\)|locator\([^)]+\))\.click\(\)/);
      if (clickMatch) {
        actions.push({
          type: 'click',
          code: clickMatch[0],
          line: line.trim(),
          confidence: 0.8
        });
      }

      const fillMatch = line.match(/(?:await\s+)?page\.(?:getBy\w+\([^)]+\)|locator\([^)]+\))\.fill\(['"`]([^'"`]+)['"`]\)/);
      if (fillMatch) {
        actions.push({
          type: 'fill',
          code: fillMatch[0],
          value: fillMatch[1],
          line: line.trim(),
          confidence: 0.8
        });
      }

      const waitMatch = line.match(/(?:await\s+)?page\.wait(?:For|ForSelector|ForTimeout)\([^)]+\)/);
      if (waitMatch) {
        actions.push({
          type: 'wait',
          code: waitMatch[0],
          line: line.trim(),
          confidence: 0.7
        });
      }

      const expectMatch = line.match(/expect\([^)]+\)\.(?:toHave|toBe|toContain)[^;]+/);
      if (expectMatch) {
        actions.push({
          type: 'assertion',
          code: expectMatch[0],
          line: line.trim(),
          confidence: 0.9
        });
      }
    }

    return actions;
  }

  /**
   * Извлекает рекомендации из ответа ИИ
   * @returns {string[]}
   */
  extractRecommendations() {
    const recommendations = [];
    const lines = this.content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Поиск списков рекомендаций
      if (trimmed.match(/^[\d\-\*\+]\s+/)) {
        recommendations.push(trimmed.replace(/^[\d\-\*\+]\s+/, ''));
      }
      
      // Поиск предложений с ключевыми словами
      if (trimmed.match(/^(рекомендую|предлагаю|советую|стоит|нужно|следует)/i)) {
        recommendations.push(trimmed);
      }
    }

    return recommendations;
  }

  /**
   * Извлекает фрагменты кода из ответа ИИ
   * @returns {Object[]}
   */
  extractCodeSnippets() {
    const snippets = [];
    const codeBlocks = this.content.match(/```[\s\S]*?```/g) || [];
    
    codeBlocks.forEach((block, index) => {
      const lines = block.split('\n');
      const language = lines[0].replace(/```/, '').trim() || 'javascript';
      const code = lines.slice(1, -1).join('\n');
      
      snippets.push({
        id: `snippet_${index}`,
        language,
        code,
        isPlaywrightCode: this.isPlaywrightCode(code)
      });
    });

    // Поиск inline кода
    const inlineMatches = this.content.match(/`[^`]+`/g) || [];
    inlineMatches.forEach((match, index) => {
      const code = match.replace(/`/g, '');
      if (this.isPlaywrightCode(code)) {
        snippets.push({
          id: `inline_${index}`,
          language: 'javascript',
          code,
          isPlaywrightCode: true,
          inline: true
        });
      }
    });

    return snippets;
  }

  /**
   * Проверяет, является ли код Playwright кодом
   * @param {string} code 
   * @returns {boolean}
   */
  isPlaywrightCode(code) {
    const playwrightKeywords = [
      'page.', 'getBy', 'locator', 'click()', 'fill()', 'type()',
      'expect(', 'toHave', 'toBe', 'toContain', 'waitFor'
    ];
    
    return playwrightKeywords.some(keyword => code.includes(keyword));
  }

  /**
   * Вычисляет уверенность в ответе на основе различных факторов
   * @returns {number} - значение от 0 до 1
   */
  calculateConfidence() {
    let confidence = 0.5; // базовая уверенность

    // Наличие конкретных действий повышает уверенность
    if (this.actions.length > 0) {
      confidence += 0.2;
    }

    // Наличие кода Playwright повышает уверенность
    const playwrightSnippets = this.codeSnippets.filter(s => s.isPlaywrightCode);
    if (playwrightSnippets.length > 0) {
      confidence += 0.2;
    }

    // Наличие рекомендаций повышает уверенность
    if (this.recommendations.length > 0) {
      confidence += 0.1;
    }

    // Соответствие типу ошибки
    if (this.matchesErrorType()) {
      confidence += 0.1;
    }

    // Длина и детальность ответа
    if (this.content.length > 200) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Проверяет, соответствует ли ответ типу ошибки
   * @returns {boolean}
   */
  matchesErrorType() {
    const content = this.content.toLowerCase();
    const errorType = this.testError.errorType;

    switch (errorType) {
      case 'TIMEOUT':
        return content.includes('timeout') || content.includes('wait');
      case 'ELEMENT_NOT_FOUND':
        return content.includes('selector') || content.includes('locator') || content.includes('element');
      case 'ASSERTION':
        return content.includes('expect') || content.includes('assertion');
      case 'NETWORK':
        return content.includes('network') || content.includes('request');
      default:
        return true;
    }
  }

  /**
   * Возвращает краткое резюме ответа
   * @returns {string}
   */
  getSummary() {
    const lines = this.content.split('\n');
    const firstMeaningfulLine = lines.find(line => 
      line.trim().length > 20 && 
      !line.startsWith('```') && 
      !line.startsWith('#')
    );
    
    return firstMeaningfulLine?.trim().substring(0, 150) + '...' || 'No summary available';
  }

  /**
   * Возвращает приоритетные действия для выполнения
   * @returns {Object[]}
   */
  getPriorityActions() {
    return this.actions
      .filter(action => action.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * Проверяет, содержит ли ответ исполняемый код
   * @returns {boolean}
   */
  hasExecutableCode() {
    return this.codeSnippets.some(snippet => snippet.isPlaywrightCode);
  }

  /**
   * Возвращает все исполняемые фрагменты кода
   * @returns {Object[]}
   */
  getExecutableCode() {
    return this.codeSnippets.filter(snippet => snippet.isPlaywrightCode);
  }

  /**
   * Проверяет качество ответа
   * @returns {Object}
   */
  validateQuality() {
    const issues = [];
    const warnings = [];

    // Проверка на слишком короткий ответ
    if (this.content.length < 50) {
      issues.push('Response is too short');
    }

    // Проверка на отсутствие конкретных рекомендаций
    if (this.recommendations.length === 0 && this.actions.length === 0) {
      warnings.push('No specific recommendations or actions found');
    }

    // Проверка на соответствие типу ошибки
    if (!this.matchesErrorType()) {
      warnings.push('Response may not match the error type');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score: this.confidence
    };
  }

  /**
   * Форматирует ответ для отображения в отчете
   * @param {string} format - 'markdown' | 'html' | 'text'
   * @returns {string}
   */
  formatForReport(format = 'markdown') {
    switch (format) {
      case 'html':
        return this.toHTML();
      case 'text':
        return this.toText();
      default:
        return this.toMarkdown();
    }
  }

  /**
   * Конвертирует в Markdown формат
   * @returns {string}
   */
  toMarkdown() {
    let markdown = `# AI Анализ ошибки\n\n`;
    markdown += `**Тест:** ${this.testError.testName}\n`;
    markdown += `**Тип ошибки:** ${this.testError.errorType}\n`;
    markdown += `**Уверенность:** ${Math.round(this.confidence * 100)}%\n\n`;
    
    if (this.recommendations.length > 0) {
      markdown += `## Рекомендации\n\n`;
      this.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }

    if (this.hasExecutableCode()) {
      markdown += `## Исправления кода\n\n`;
      this.getExecutableCode().forEach(snippet => {
        markdown += `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n`;
      });
    }

    markdown += `## Полный ответ\n\n${this.content}`;
    
    return markdown;
  }

  /**
   * Простая хеш-функция
   * @param {string} str 
   * @returns {string}
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
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
      content: this.content,
      testError: this.testError.toJSON(),
      metadata: this.metadata,
      actions: this.actions,
      recommendations: this.recommendations,
      codeSnippets: this.codeSnippets,
      confidence: this.confidence
    };
  }

  /**
   * Создание из JSON
   * @param {Object} json 
   * @returns {AIResponse}
   */
  static fromJSON(json) {
    const testError = TestError.fromJSON(json.testError);
    const response = new AIResponse(json.content, testError, json.metadata);
    response.id = json.id;
    response.actions = json.actions;
    response.recommendations = json.recommendations;
    response.codeSnippets = json.codeSnippets;
    response.confidence = json.confidence;
    return response;
  }
} 
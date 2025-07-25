// DemoProject/lib/detailedCoverageTracker.js

import fs from 'fs';
import path from 'path';

/**
 * Детальный трекер покрытия UI элементов
 * Отслеживает какие именно элементы покрыты тестами, а какие нет
 */
export class DetailedCoverageTracker {
  constructor(config = {}) {
    this.config = {
      trackingEnabled: config.trackingEnabled !== false,
      outputDir: config.outputDir || 'detailed-coverage',
      includeSelectors: config.includeSelectors !== false,
      includeScreenshots: config.includeScreenshots || false,
      ...config
    };
    
    // Хранилище информации о покрытии
    this.coverageData = {
      allElements: new Map(),           // Все найденные элементы
      coveredElements: new Map(),       // Покрытые элементы
      uncoveredElements: new Map(),     // Непокрытые элементы
      testExecutions: new Map(),        // История выполнения тестов
      interactions: [],                 // История взаимодействий
      sessions: []                      // Сессии тестирования
    };
    
    this.currentSession = null;
  }

  /**
   * 🎯 Начало новой сессии тестирования
   */
  startSession(sessionName = `session-${Date.now()}`) {
    this.currentSession = {
      id: sessionName,
      startTime: new Date().toISOString(),
      tests: [],
      pages: new Map(),
      totalElements: 0,
      coveredCount: 0,
      interactions: []
    };
    
    this.coverageData.sessions.push(this.currentSession);
    console.log(`🎬 Начата сессия покрытия: ${sessionName}`);
    
    return sessionName;
  }

  /**
   * 📊 Регистрация всех элементов на странице
   */
  registerPageElements(pageName, mcpSnapshot, testName = null) {
    if (!this.currentSession) {
      this.startSession();
    }
    
    const elements = this.parseElementsFromSnapshot(mcpSnapshot);
    const pageData = {
      name: pageName,
      timestamp: new Date().toISOString(),
      testName,
      elements: elements,
      totalCount: elements.length
    };
    
    // Сохранение элементов страницы
    this.currentSession.pages.set(pageName, pageData);
    this.currentSession.totalElements += elements.length;
    
    // Регистрация всех элементов в общем реестре
    elements.forEach(element => {
      const elementId = this.generateElementId(element);
      
      if (!this.coverageData.allElements.has(elementId)) {
        this.coverageData.allElements.set(elementId, {
          ...element,
          id: elementId,
          firstSeen: new Date().toISOString(),
          pages: new Set([pageName]),
          tests: new Set(),
          interactions: [],
          covered: false
        });
      } else {
        // Обновление существующего элемента
        const existing = this.coverageData.allElements.get(elementId);
        existing.pages.add(pageName);
        if (testName) existing.tests.add(testName);
      }
    });
    
    console.log(`📋 Зарегистрировано ${elements.length} элементов на странице ${pageName}`);
    return elements;
  }

  /**
   * ✅ Отметка элемента как покрытого
   */
  markElementCovered(element, testName, interactionType = 'unknown') {
    const elementId = this.generateElementId(element);
    const timestamp = new Date().toISOString();
    
    // Обновление в общем реестре
    if (this.coverageData.allElements.has(elementId)) {
      const elementData = this.coverageData.allElements.get(elementId);
      elementData.covered = true;
      elementData.tests.add(testName);
      elementData.interactions.push({
        type: interactionType,
        testName,
        timestamp
      });
      
      // Перемещение в покрытые
      this.coverageData.coveredElements.set(elementId, elementData);
      this.coverageData.uncoveredElements.delete(elementId);
    }
    
    // Запись взаимодействия
    const interaction = {
      elementId,
      element,
      testName,
      interactionType,
      timestamp,
      sessionId: this.currentSession?.id
    };
    
    this.coverageData.interactions.push(interaction);
    if (this.currentSession) {
      this.currentSession.interactions.push(interaction);
      this.currentSession.coveredCount++;
    }
    
    console.log(`✅ Элемент покрыт: ${element.text || element.type} (${interactionType})`);
  }

  /**
   * 🌳 Парсинг элементов из MCP snapshot
   */
  parseElementsFromSnapshot(snapshotContent) {
    const lines = snapshotContent.split('\n');
    const elements = [];
    const elementStack = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Определение уровня вложенности
      const indent = line.length - line.trimStart().length;
      const level = Math.floor(indent / 2);
      
      // Парсинг элемента
      const element = this.parseElementLine(trimmed, i + 1);
      if (element) {
        element.level = level;
        element.lineNumber = i + 1;
        element.parent = level > 0 ? elementStack[level - 1] : null;
        element.children = [];
        
        // Построение иерархии
        if (element.parent) {
          element.parent.children.push(element);
          element.path = `${element.parent.path} > ${element.text || element.type}`;
        } else {
          element.path = element.text || element.type;
        }
        
        // Обновление стека
        elementStack[level] = element;
        elementStack.splice(level + 1);
        
        elements.push(element);
      }
    }
    
    return elements;
  }

  /**
   * Парсинг отдельной строки элемента
   */
  parseElementLine(line, lineNumber) {
    // Различные паттерны для разных типов элементов
    const patterns = {
      button: /- button[:\s]+"?([^"]*)"?/,
      link: /- link[:\s]+"?([^"]*)"?/,
      input: /- (input|textbox)[:\s]+"?([^"]*)"?/,
      navigation: /- navigation[:\s]+"?([^"]*)"?/,
      form: /- form[:\s]+"?([^"]*)"?/,
      heading: /- heading[:\s]+"?([^"]*)"?/,
      region: /- region[:\s]+"?([^"]*)"?/,
      img: /- img[:\s]+"?([^"]*)"?/,
      text: /text[:\s]+"?([^"]*)"?/,
      url: /\/url[:\s]+"?([^"]*)"?/
    };
    
    let element = null;
    
    // Поиск соответствующего паттерна
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = line.match(pattern);
      if (match) {
        element = {
          type,
          text: match[1] || '',
          rawLine: line,
          lineNumber,
          attributes: this.extractAttributes(line),
          url: this.extractUrl(line),
          selector: this.generateSelector(type, match[1]),
          interactable: this.isInteractable(type),
          critical: this.isCritical(type, match[1])
        };
        break;
      }
    }
    
    return element;
  }

  /**
   * 🔍 Генерация детального отчета покрытия
   */
  generateDetailedCoverageReport(sessionId = null) {
    const session = sessionId ? 
      this.coverageData.sessions.find(s => s.id === sessionId) : 
      this.currentSession;
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    const allElements = Array.from(this.coverageData.allElements.values());
    const coveredElements = allElements.filter(el => el.covered);
    const uncoveredElements = allElements.filter(el => !el.covered);
    
    // Группировка по типам
    const elementsByType = this.groupElementsByType(allElements);
    const coverageByType = this.calculateCoverageByType(elementsByType);
    
    // Группировка по страницам
    const elementsByPage = this.groupElementsByPage(allElements);
    const coverageByPage = this.calculateCoverageByPage(elementsByPage);
    
    // Критичные элементы
    const criticalElements = allElements.filter(el => el.critical);
    const criticalCoverage = this.calculateCriticalCoverage(criticalElements);
    
    const report = {
      session: {
        id: session.id,
        startTime: session.startTime,
        duration: this.calculateSessionDuration(session),
        testsCount: session.tests.length
      },
      
      summary: {
        totalElements: allElements.length,
        coveredElements: coveredElements.length,
        uncoveredElements: uncoveredElements.length,
        coveragePercentage: Math.round((coveredElements.length / allElements.length) * 100),
        interactionsCount: session.interactions.length
      },
      
      coverageByType,
      coverageByPage,
      criticalCoverage,
      
      detailedElements: {
        covered: this.formatElementsForReport(coveredElements),
        uncovered: this.formatElementsForReport(uncoveredElements),
        critical: this.formatElementsForReport(criticalElements)
      },
      
      interactions: session.interactions.map(interaction => ({
        ...interaction,
        elementPath: this.getElementPath(interaction.elementId)
      })),
      
      recommendations: this.generateDetailedRecommendations(uncoveredElements, criticalElements)
    };
    
    return report;
  }

  /**
   * 🌳 Генерация древовидного представления покрытия
   */
  generateCoverageTree(pageName = null) {
    const elements = pageName ? 
      this.getElementsForPage(pageName) : 
      Array.from(this.coverageData.allElements.values());
    
    // Построение дерева
    const rootElements = elements.filter(el => !el.parent);
    const tree = this.buildElementTree(rootElements, elements);
    
    return {
      pageName: pageName || 'all-pages',
      totalElements: elements.length,
      tree: tree.map(node => this.formatTreeNode(node))
    };
  }

  /**
   * Построение дерева элементов
   */
  buildElementTree(rootElements, allElements) {
    return rootElements.map(root => {
      const node = { ...root };
      node.children = this.findChildren(root, allElements);
      return node;
    });
  }

  /**
   * Поиск дочерних элементов
   */
  findChildren(parent, allElements) {
    const children = allElements.filter(el => 
      el.parent && this.generateElementId(el.parent) === this.generateElementId(parent)
    );
    
    return children.map(child => {
      const node = { ...child };
      node.children = this.findChildren(child, allElements);
      return node;
    });
  }

  /**
   * Форматирование узла дерева
   */
  formatTreeNode(node) {
    const coverageIcon = node.covered ? '✅' : '❌';
    const criticalIcon = node.critical ? '🔴' : '';
    const interactableIcon = node.interactable ? '🎯' : '';
    
    return {
      id: this.generateElementId(node),
      type: node.type,
      text: node.text,
      path: node.path,
      covered: node.covered,
      critical: node.critical,
      interactable: node.interactable,
      level: node.level,
      
      displayText: `${coverageIcon} ${criticalIcon} ${interactableIcon} ${node.type}: "${node.text}"`,
      
      coverage: {
        status: node.covered ? 'covered' : 'uncovered',
        tests: Array.from(node.tests || []),
        interactions: node.interactions || []
      },
      
      children: (node.children || []).map(child => this.formatTreeNode(child))
    };
  }

  /**
   * 📄 Генерация HTML отчета с интерактивным деревом
   */
  async generateInteractiveHTMLReport(sessionId = null) {
    const report = this.generateDetailedCoverageReport(sessionId);
    const tree = this.generateCoverageTree();
    
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Coverage Report - ${report.session.id}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { opacity: 0.9; }
        .tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #667eea; color: #667eea; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .tree { font-family: monospace; }
        .tree-node { margin: 2px 0; padding: 2px 5px; border-radius: 3px; }
        .tree-node.covered { background: #e8f5e8; }
        .tree-node.uncovered { background: #ffeaea; }
        .tree-node.critical { border-left: 3px solid #ff4444; }
        .element-list { max-height: 400px; overflow-y: auto; }
        .element-item { padding: 10px; border: 1px solid #eee; margin: 5px 0; border-radius: 5px; }
        .element-item.covered { border-left: 4px solid #4caf50; }
        .element-item.uncovered { border-left: 4px solid #f44336; }
        .filters { margin-bottom: 20px; }
        .filter-btn { padding: 8px 16px; margin: 0 5px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px; }
        .filter-btn.active { background: #667eea; color: white; }
        .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 UI Coverage Report</h1>
            <p>Сессия: ${report.session.id} | Время: ${report.session.startTime}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${report.summary.totalElements}</div>
                <div class="stat-label">Всего элементов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.summary.coveredElements}</div>
                <div class="stat-label">Покрыто</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.summary.uncoveredElements}</div>
                <div class="stat-label">Не покрыто</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.summary.coveragePercentage}%</div>
                <div class="stat-label">Покрытие</div>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${report.summary.coveragePercentage}%"></div>
        </div>
        
        <div class="tabs">
            <div class="tab active" onclick="showTab('tree')">🌳 Дерево элементов</div>
            <div class="tab" onclick="showTab('covered')">✅ Покрытые (${report.summary.coveredElements})</div>
            <div class="tab" onclick="showTab('uncovered')">❌ Не покрытые (${report.summary.uncoveredElements})</div>
            <div class="tab" onclick="showTab('critical')">🔴 Критичные</div>
            <div class="tab" onclick="showTab('interactions')">🎯 Взаимодействия</div>
        </div>
        
        <div id="tree" class="tab-content active">
            <div class="filters">
                <button class="filter-btn active" onclick="filterElements('all')">Все</button>
                <button class="filter-btn" onclick="filterElements('covered')">Покрытые</button>
                <button class="filter-btn" onclick="filterElements('uncovered')">Не покрытые</button>
                <button class="filter-btn" onclick="filterElements('critical')">Критичные</button>
                <button class="filter-btn" onclick="filterElements('interactable')">Интерактивные</button>
            </div>
            <div class="tree" id="element-tree">
                ${this.generateTreeHTML(tree.tree)}
            </div>
        </div>
        
        <div id="covered" class="tab-content">
            <div class="element-list">
                ${this.generateElementListHTML(report.detailedElements.covered, 'covered')}
            </div>
        </div>
        
        <div id="uncovered" class="tab-content">
            <div class="element-list">
                ${this.generateElementListHTML(report.detailedElements.uncovered, 'uncovered')}
            </div>
        </div>
        
        <div id="critical" class="tab-content">
            <div class="element-list">
                ${this.generateElementListHTML(report.detailedElements.critical, 'critical')}
            </div>
        </div>
        
        <div id="interactions" class="tab-content">
            <div class="element-list">
                ${this.generateInteractionsHTML(report.interactions)}
            </div>
        </div>
    </div>
    
    <script>
        const reportData = ${JSON.stringify(report)};
        const treeData = ${JSON.stringify(tree)};
        
        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
        
        function filterElements(filter) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            const nodes = document.querySelectorAll('.tree-node');
            nodes.forEach(node => {
                const show = filter === 'all' || 
                           (filter === 'covered' && node.classList.contains('covered')) ||
                           (filter === 'uncovered' && node.classList.contains('uncovered')) ||
                           (filter === 'critical' && node.classList.contains('critical')) ||
                           (filter === 'interactable' && node.dataset.interactable === 'true');
                
                node.style.display = show ? 'block' : 'none';
            });
        }
        
        function toggleNode(nodeId) {
            const children = document.querySelectorAll(\`[data-parent="\${nodeId}"]\`);
            const toggle = document.getElementById(\`toggle-\${nodeId}\`);
            
            children.forEach(child => {
                child.style.display = child.style.display === 'none' ? 'block' : 'none';
            });
            
            toggle.textContent = toggle.textContent === '▼' ? '▶' : '▼';
        }
    </script>
</body>
</html>`;
    
    return html;
  }

  /**
   * Генерация HTML для дерева элементов
   */
  generateTreeHTML(nodes, level = 0) {
    return nodes.map(node => {
      const indent = '  '.repeat(level);
      const hasChildren = node.children && node.children.length > 0;
      const toggle = hasChildren ? `<span id="toggle-${node.id}" onclick="toggleNode('${node.id}')" style="cursor: pointer;">▼</span>` : '';
      
      const nodeClasses = [
        'tree-node',
        node.covered ? 'covered' : 'uncovered',
        node.critical ? 'critical' : ''
      ].filter(Boolean).join(' ');
      
      let html = `<div class="${nodeClasses}" data-interactable="${node.interactable}" style="margin-left: ${level * 20}px;">
        ${toggle} ${node.displayText}
        <small style="color: #666;"> (${node.coverage.tests.length} тестов)</small>
      </div>`;
      
      if (hasChildren) {
        html += this.generateTreeHTML(node.children, level + 1);
      }
      
      return html;
    }).join('');
  }

  /**
   * Генерация HTML для списка элементов
   */
  generateElementListHTML(elements, type) {
    return elements.map(element => `
      <div class="element-item ${type}">
        <strong>${element.type}: "${element.text}"</strong>
        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
          Путь: ${element.path}<br>
          Селектор: ${element.selector}<br>
          Тесты: ${element.tests.join(', ') || 'Нет'}<br>
          Взаимодействий: ${element.interactions.length}
        </div>
      </div>
    `).join('');
  }

  /**
   * Генерация HTML для взаимодействий
   */
  generateInteractionsHTML(interactions) {
    return interactions.map(interaction => `
      <div class="element-item covered">
        <strong>${interaction.interactionType}: ${interaction.element.text || interaction.element.type}</strong>
        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
          Тест: ${interaction.testName}<br>
          Время: ${new Date(interaction.timestamp).toLocaleString()}<br>
          Путь: ${interaction.elementPath}
        </div>
      </div>
    `).join('');
  }

  // Вспомогательные методы

  generateElementId(element) {
    const key = `${element.type}-${element.text}-${element.lineNumber || ''}`;
    return Buffer.from(key).toString('base64').slice(0, 16);
  }

  extractAttributes(line) {
    const attrs = [];
    if (line.includes('aria-label')) attrs.push('aria-label');
    if (line.includes('role=')) attrs.push('role');
    if (line.includes('data-testid')) attrs.push('data-testid');
    return attrs;
  }

  extractUrl(line) {
    const match = line.match(/\/url[:\s]+"?([^"\s]+)"?/);
    return match ? match[1] : '';
  }

  generateSelector(type, text) {
    if (text) {
      return `${type}:has-text("${text}")`;
    }
    return type;
  }

  isInteractable(type) {
    return ['button', 'link', 'input', 'textbox'].includes(type);
  }

  isCritical(type, text) {
    const criticalKeywords = ['submit', 'login', 'buy', 'checkout', 'save', 'send'];
    return criticalKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  groupElementsByType(elements) {
    return elements.reduce((groups, element) => {
      if (!groups[element.type]) {
        groups[element.type] = [];
      }
      groups[element.type].push(element);
      return groups;
    }, {});
  }

  calculateCoverageByType(elementsByType) {
    const result = {};
    
    for (const [type, elements] of Object.entries(elementsByType)) {
      const covered = elements.filter(el => el.covered).length;
      const total = elements.length;
      
      result[type] = {
        total,
        covered,
        uncovered: total - covered,
        percentage: Math.round((covered / total) * 100)
      };
    }
    
    return result;
  }

  groupElementsByPage(elements) {
    const result = {};
    
    elements.forEach(element => {
      element.pages.forEach(page => {
        if (!result[page]) {
          result[page] = [];
        }
        result[page].push(element);
      });
    });
    
    return result;
  }

  calculateCoverageByPage(elementsByPage) {
    const result = {};
    
    for (const [page, elements] of Object.entries(elementsByPage)) {
      const covered = elements.filter(el => el.covered).length;
      const total = elements.length;
      
      result[page] = {
        total,
        covered,
        uncovered: total - covered,
        percentage: Math.round((covered / total) * 100)
      };
    }
    
    return result;
  }

  calculateCriticalCoverage(criticalElements) {
    const covered = criticalElements.filter(el => el.covered).length;
    const total = criticalElements.length;
    
    return {
      total,
      covered,
      uncovered: total - covered,
      percentage: total > 0 ? Math.round((covered / total) * 100) : 100,
      elements: criticalElements.map(el => ({
        ...this.formatElementsForReport([el])[0],
        status: el.covered ? 'covered' : 'uncovered'
      }))
    };
  }

  formatElementsForReport(elements) {
    return elements.map(element => ({
      id: this.generateElementId(element),
      type: element.type,
      text: element.text,
      path: element.path,
      selector: element.selector,
      covered: element.covered,
      critical: element.critical,
      interactable: element.interactable,
      tests: Array.from(element.tests || []),
      interactions: element.interactions || [],
      pages: Array.from(element.pages || [])
    }));
  }

  generateDetailedRecommendations(uncoveredElements, criticalElements) {
    const recommendations = [];
    
    // Критичные непокрытые элементы
    const uncoveredCritical = criticalElements.filter(el => !el.covered);
    if (uncoveredCritical.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Critical Coverage',
        message: `${uncoveredCritical.length} критичных элементов не покрыты тестами`,
        elements: uncoveredCritical.map(el => el.text || el.type),
        action: 'Добавьте тесты для взаимодействия с критичными элементами'
      });
    }
    
    // Интерактивные непокрытые элементы
    const uncoveredInteractable = uncoveredElements.filter(el => el.interactable);
    if (uncoveredInteractable.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Interactive Coverage',
        message: `${uncoveredInteractable.length} интерактивных элементов не покрыты`,
        elements: uncoveredInteractable.slice(0, 5).map(el => el.text || el.type),
        action: 'Рассмотрите добавление тестов для основных интерактивных элементов'
      });
    }
    
    return recommendations;
  }

  getElementsForPage(pageName) {
    return Array.from(this.coverageData.allElements.values())
      .filter(el => el.pages.has(pageName));
  }

  getElementPath(elementId) {
    const element = this.coverageData.allElements.get(elementId);
    return element ? element.path : 'Unknown';
  }

  calculateSessionDuration(session) {
    if (!session.startTime) return 'Unknown';
    
    const start = new Date(session.startTime);
    const end = new Date();
    const duration = Math.round((end - start) / 1000);
    
    return `${duration}s`;
  }

  /**
   * 💾 Сохранение отчетов
   */
  async saveDetailedReports(sessionId = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = this.config.outputDir;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // JSON отчет
    const jsonReport = this.generateDetailedCoverageReport(sessionId);
    const jsonPath = path.join(outputDir, `detailed-coverage-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    
    // HTML отчет
    const htmlReport = await this.generateInteractiveHTMLReport(sessionId);
    const htmlPath = path.join(outputDir, `detailed-coverage-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    // Дерево покрытия
    const tree = this.generateCoverageTree();
    const treePath = path.join(outputDir, `coverage-tree-${timestamp}.json`);
    fs.writeFileSync(treePath, JSON.stringify(tree, null, 2));
    
    console.log(`📊 Детальные отчеты сохранены:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Tree: ${treePath}`);
    
    return {
      json: jsonPath,
      html: htmlPath,
      tree: treePath
    };
  }
}
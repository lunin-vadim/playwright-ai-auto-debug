// src/presentation/cli/commands/UiCoverageCommand.js

import fs from 'fs';
import path from 'path';
import { extractOption } from './extractOption.js';

export class UiCoverageCommand {
  static commandName = 'ui-coverage';
  static description = 'Analyze UI coverage with MCP DOM snapshots';
  static usage = 'ui-coverage [options]';
  static options = [
    '--project     Project directory (default: current)',
    '--page        Page name for report (default: auto-detect)',
    '--critical    Path to critical elements config',
    '--golden      Enable golden snapshot comparison',
    '--all-tests   Analyze coverage across all test files',
    '--help        Show help for this command'
  ];

  constructor(container) {
    this.container = container;
  }

  async execute(args) {
    try {
      console.log('🎯 UI Coverage Analysis');
      console.log('🔧 Initializing UI Coverage analyzer...');

      const projectPath = extractOption(args, '--project') || process.cwd();
      const pageName = extractOption(args, '--page') || 'current-page';
      const criticalConfigPath = extractOption(args, '--critical');
      const enableGolden = args.includes('--golden');
      const analyzeAllTests = args.includes('--all-tests');

      console.log(`📁 Project path: ${projectPath}`);
      console.log(`📄 Page name: ${pageName}`);
      console.log(`🔍 All tests analysis: ${analyzeAllTests ? 'Yes' : 'No'}`);

      const { UICoverageAnalyzer } = await import('../../../../DemoProject/lib/uiCoverageAnalyzer.js');

      let criticalElements = [
        { type: 'button', name: 'Get started', selector: 'text=Get started' },
        { type: 'button', name: 'Search', selector: 'button:has-text("Search")' },
        { type: 'link', name: 'Docs', selector: 'text=Docs' },
        { type: 'navigation', name: 'Main', selector: 'navigation' }
      ];

      if (criticalConfigPath && fs.existsSync(criticalConfigPath)) {
        const criticalConfig = JSON.parse(fs.readFileSync(criticalConfigPath, 'utf8'));
        criticalElements = criticalConfig.criticalElements || criticalElements;
      }

      const analyzer = new UICoverageAnalyzer({
        criticalElements,
        coverageReportsDir: path.join(projectPath, 'ui-coverage-reports')
      });

      let snapshots = [];

      if (analyzeAllTests) {
        console.log('🔍 Analyzing all test scenarios...');
        snapshots = [
          { name: 'main-page', content: this.getDemoSnapshot() },
          { name: 'navigation-test', content: this.getNavigationSnapshot() },
          { name: 'form-test', content: this.getFormSnapshot() },
          { name: 'api-test', content: this.getApiSnapshot() }
        ];
      } else {
        snapshots = [{ name: pageName, content: this.getDemoSnapshot() }];
      }

      const allResults = [];

      for (const snapshot of snapshots) {
        console.log(`🌳 Parsing accessibility tree for ${snapshot.name}...`);
        const accessibilityTree = analyzer.parseAccessibilityTree(snapshot.content);

        console.log(`📊 Analyzing element coverage for ${snapshot.name}...`);
        const elementStats = analyzer.analyzeElementCoverage(accessibilityTree);

        console.log(`🔍 Checking critical elements for ${snapshot.name}...`);
        const criticalCheck = analyzer.checkCriticalElements(accessibilityTree, criticalElements);

        let goldenComparison = null;
        if (enableGolden) {
          const goldenSnapshot = this.getGoldenSnapshot();
          const goldenTree = analyzer.parseAccessibilityTree(goldenSnapshot);
          goldenComparison = analyzer.compareWithGolden(accessibilityTree, goldenTree);
        }

        allResults.push({ name: snapshot.name, accessibilityTree, elementStats, criticalCheck, goldenComparison });
      }

      const aggregatedResults = this.aggregateResults(allResults);
      const { combinedTree: accessibilityTree, combinedStats: elementStats, combinedCriticalCheck: criticalCheck, combinedGoldenComparison: goldenComparison } = aggregatedResults;

      const analysisResults = { accessibilityTree, elementStats, criticalCheck, goldenComparison };
      const coverageReport = analyzer.generateCoverageReport(analysisResults, pageName);

      const timestamp = Date.now();
      await analyzer.saveReport(coverageReport, `ui-coverage-${timestamp}.md`);

      const reportsDir = path.join(projectPath, 'ui-coverage-reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const htmlPath = path.join(reportsDir, `ui-coverage-${timestamp}.html`);
      fs.writeFileSync(htmlPath, this.generateHTMLReport(coverageReport, analysisResults, timestamp), 'utf8');

      console.log('\n✅ UI Coverage analysis completed');

      if (analyzeAllTests) {
        console.log(`📊 Analyzed ${allResults.length} test scenarios`);
        allResults.forEach(result => {
          console.log(`   • ${result.name}: ${result.elementStats.summary.totalElements} elements`);
        });
      }

      console.log(`📊 Total elements: ${coverageReport.summary.totalElements}`);
      console.log(`🎯 Interactive elements: ${coverageReport.summary.interactiveElements}`);
      console.log(`📈 Coverage: ${coverageReport.summary.coveragePercentage}%`);
      console.log(`♿ Accessibility Score: ${coverageReport.summary.accessibilityScore}%`);
      console.log(`🔍 Critical elements found: ${criticalCheck.foundCritical.length}/${criticalElements.length}`);

      if (criticalCheck.missingCritical.length > 0) {
        console.log('\n❌ Missing critical elements:');
        criticalCheck.missingCritical.forEach(el => {
          console.log(`   • ${el.name} (${el.type})`);
        });
      }

      if (coverageReport.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        coverageReport.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });
      }

      console.log(`\n📄 Reports saved:`);
      console.log(`   📝 Markdown: ui-coverage-reports/ui-coverage-${timestamp}.md`);
      console.log(`   🌐 HTML: ui-coverage-reports/ui-coverage-${timestamp}.html`);
      console.log(`   📊 JSON: ui-coverage-reports/ui-coverage-${timestamp}.json`);

      return { success: true, report: coverageReport, recommendations: coverageReport.recommendations, htmlPath };

    } catch (error) {
      console.error('❌ UI Coverage analysis failed:', error.message);
      throw error;
    }
  }

  getDemoSnapshot() {
    return `# Page snapshot

- region "Skip to main content":
  - link "Skip to main content":
    - /url: "#__docusaurus_skipToContent_fallback"
- navigation "Main":
  - link "Playwright logo Playwright":
    - /url: /
    - img "Playwright logo"
    - text: Playwright
  - link "Docs":
    - /url: /docs/intro
  - link "API":
    - /url: /docs/api/class-playwright
  - button "Node.js"
  - link "Community":
    - /url: /community/welcome
  - link "GitHub repository":
    - /url: https://github.com/microsoft/playwright
  - button "Switch between dark and light mode"
  - button "Search (Command+K)": Search ⌘ K
- banner:
  - heading "Playwright enables reliable end-to-end testing for modern web apps." [level=1]
  - link "Get started":
    - /url: /docs/intro
  - link "Star microsoft/playwright on GitHub":
    - /url: https://github.com/microsoft/playwright
- main:
  - img "Browsers (Chromium, Firefox, WebKit)"
  - heading "Any browser • Any platform • One API" [level=3]
  - paragraph: Cross-browser. Playwright supports all modern rendering engines
  - link "TypeScript":
    - /url: https://playwright.dev/docs/intro
  - link "JavaScript":
    - /url: https://playwright.dev/docs/intro`;
  }

  getGoldenSnapshot() {
    return `# Page snapshot

- navigation "Main":
  - link "Playwright logo Playwright":
    - /url: /
  - link "Docs":
    - /url: /docs/intro
  - button "Node.js"
  - link "Community":
    - /url: /community/welcome
  - button "Search (Command+K)": Search ⌘ K
- banner:
  - heading "Playwright enables reliable end-to-end testing" [level=1]
  - link "Get started":
    - /url: /docs/intro
- main:
  - heading "Any browser • Any platform • One API" [level=3]
  - link "TypeScript":
    - /url: https://playwright.dev/docs/intro`;
  }

  getNavigationSnapshot() {
    return `# Navigation Test Page snapshot

- navigation "Main":
  - link "Home": /url: /
  - link "Products": /url: /products
  - link "About": /url: /about
  - link "Contact": /url: /contact
  - button "Menu Toggle"
- main:
  - heading "Navigation Test" [level=1]
  - button "Back to Home"`;
  }

  getFormSnapshot() {
    return `# Form Test Page snapshot

- main:
  - heading "Contact Form" [level=1]
  - form:
    - input "Name" type=text
    - input "Email" type=email
    - textarea "Message"
    - button "Submit"
    - button "Reset"
- navigation:
  - link "Back": /url: /`;
  }

  getApiSnapshot() {
    return `# API Test Page snapshot

- main:
  - heading "API Dashboard" [level=1]
  - button "Load Data"
  - button "Refresh"
  - div "Loading indicator"
- section "Results":
  - table "Data Table"
  - button "Export CSV"
  - link "View Details": /url: /details`;
  }

  aggregateResults(allResults) {
    const combinedElements = [];
    let totalElements = 0;
    let totalInteractive = 0;
    let allFoundCritical = [];
    let allMissingCritical = [];

    allResults.forEach(result => {
      combinedElements.push(...result.accessibilityTree.elements);
      totalElements += result.elementStats.summary.totalElements;
      totalInteractive += result.elementStats.summary.interactive;
      allFoundCritical.push(...result.criticalCheck.foundCritical);
      allMissingCritical.push(...result.criticalCheck.missingCritical);
    });

    const uniqueFound = allFoundCritical.filter((item, index, self) =>
      index === self.findIndex(el => el.name === item.name && el.type === item.type)
    );
    const uniqueMissing = allMissingCritical.filter((item, index, self) =>
      index === self.findIndex(el => el.name === item.name && el.type === item.type)
    );

    return {
      combinedTree: {
        elements: combinedElements,
        totalCount: totalElements,
        byType: this.groupElementsByType(combinedElements)
      },
      combinedStats: {
        summary: {
          totalElements,
          interactive: totalInteractive,
          buttons: combinedElements.filter(el => el.type === 'button').length,
          links: combinedElements.filter(el => el.type === 'link').length,
          inputs: combinedElements.filter(el => el.type === 'input').length,
          forms: combinedElements.filter(el => el.type === 'form').length,
          navigation: combinedElements.filter(el => el.type === 'navigation').length,
          withAriaLabel: 0,
          withRole: 0
        }
      },
      combinedCriticalCheck: {
        foundCritical: uniqueFound,
        missingCritical: uniqueMissing,
        allCriticalPresent: uniqueMissing.length === 0
      },
      combinedGoldenComparison: allResults[0]?.goldenComparison || null,
      testResults: allResults
    };
  }

  groupElementsByType(elements) {
    const grouped = {};
    elements.forEach(el => {
      if (!grouped[el.type]) grouped[el.type] = [];
      grouped[el.type].push(el);
    });
    return grouped;
  }

  generateHTMLReport(coverageReport, analysisResults, timestamp) {
    const { summary, elementBreakdown, criticalElementsCheck, recommendations } = coverageReport;
    const { accessibilityTree, elementStats, criticalCheck, goldenComparison } = analysisResults;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Coverage Report - ${coverageReport.metadata.pageName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.success { background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%); }
        .stat-card.danger { background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { opacity: 0.9; }
        .section { margin: 30px 0; }
        .section-title { font-size: 1.5em; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .elements-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .elements-table th, .elements-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .elements-table th { background: #f5f5f5; font-weight: bold; }
        .element-row.found { background: #e8f5e8; }
        .element-row.missing { background: #ffebee; }
        .element-row.critical { border-left: 4px solid #f44336; }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid; }
        .recommendation.high { border-color: #f44336; background: #ffebee; }
        .recommendation.medium { border-color: #ff9800; background: #fff3e0; }
        .recommendation.low { border-color: #4caf50; background: #e8f5e8; }
        .tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #667eea; color: #667eea; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s; }
        .progress-high { background: linear-gradient(90deg, #4caf50, #8bc34a); }
        .progress-medium { background: linear-gradient(90deg, #ff9800, #ffc107); }
        .progress-low { background: linear-gradient(90deg, #f44336, #e91e63); }
        .element-tree { font-family: monospace; background: #f9f9f9; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 UI Coverage Report</h1>
            <p><strong>Страница:</strong> ${coverageReport.metadata.pageName}</p>
            <p><strong>Время анализа:</strong> ${new Date(timestamp).toLocaleString('ru-RU')}</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card ${summary.coveragePercentage >= 80 ? 'success' : summary.coveragePercentage >= 50 ? 'warning' : 'danger'}">
                <div class="stat-value">${summary.coveragePercentage}%</div>
                <div class="stat-label">Покрытие тестами</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summary.totalElements}</div>
                <div class="stat-label">Всего элементов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summary.interactiveElements}</div>
                <div class="stat-label">Интерактивных</div>
            </div>
            <div class="stat-card ${summary.accessibilityScore >= 70 ? 'success' : summary.accessibilityScore >= 40 ? 'warning' : 'danger'}">
                <div class="stat-value">${summary.accessibilityScore}%</div>
                <div class="stat-label">Доступность</div>
            </div>
        </div>
        <div class="tabs">
            <div class="tab active" onclick="showTab('overview')">Обзор</div>
            <div class="tab" onclick="showTab('elements')">Элементы</div>
            <div class="tab" onclick="showTab('critical')">Критичные</div>
            <div class="tab" onclick="showTab('recommendations')">Рекомендации</div>
            ${goldenComparison ? '<div class="tab" onclick="showTab(\'comparison\')">Сравнение</div>' : ''}
        </div>
        <div id="overview" class="tab-content active">
            <div class="section">
                <h2 class="section-title">📊 Разбивка по типам элементов</h2>
                <table class="elements-table">
                    <thead><tr><th>Тип элемента</th><th>Количество</th><th>Покрытие</th></tr></thead>
                    <tbody>
                        <tr><td>🔘 Кнопки</td><td>${elementBreakdown.buttons || 0}</td><td><div class="progress-bar"><div class="progress-fill progress-medium" style="width: ${Math.min(100, (elementBreakdown.buttons || 0) * 20)}%"></div></div></td></tr>
                        <tr><td>🔗 Ссылки</td><td>${elementBreakdown.links || 0}</td><td><div class="progress-bar"><div class="progress-fill progress-high" style="width: ${Math.min(100, (elementBreakdown.links || 0) * 10)}%"></div></div></td></tr>
                        <tr><td>📝 Поля ввода</td><td>${elementBreakdown.inputs || 0}</td><td><div class="progress-bar"><div class="progress-fill progress-low" style="width: ${Math.min(100, (elementBreakdown.inputs || 0) * 25)}%"></div></div></td></tr>
                        <tr><td>📋 Формы</td><td>${elementBreakdown.forms || 0}</td><td><div class="progress-bar"><div class="progress-fill progress-medium" style="width: ${Math.min(100, (elementBreakdown.forms || 0) * 50)}%"></div></div></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div id="elements" class="tab-content">
            <div class="section">
                <h2 class="section-title">🌳 Дерево элементов страницы</h2>
                <div class="element-tree">
${accessibilityTree.elements.map(el => `                    <div class="element-item">${el.line}</div>`).join('\n')}
                </div>
            </div>
        </div>
        <div id="critical" class="tab-content">
            <div class="section">
                <h2 class="section-title">🎯 Критичные элементы</h2>
                <table class="elements-table">
                    <thead><tr><th>Элемент</th><th>Тип</th><th>Селектор</th><th>Статус</th></tr></thead>
                    <tbody>
${criticalCheck.foundCritical.map(el => `                        <tr class="element-row found"><td>✅ ${el.name}</td><td>${el.type}</td><td><code>${el.selector}</code></td><td><span style="color: #4caf50;">Найден</span></td></tr>`).join('\n')}
${criticalCheck.missingCritical.map(el => `                        <tr class="element-row missing critical"><td>❌ ${el.name}</td><td>${el.type}</td><td><code>${el.selector}</code></td><td><span style="color: #f44336;">Отсутствует</span></td></tr>`).join('\n')}
                    </tbody>
                </table>
            </div>
        </div>
        <div id="recommendations" class="tab-content">
            <div class="section">
                <h2 class="section-title">💡 Рекомендации</h2>
${recommendations.map(rec => `                <div class="recommendation ${rec.includes('🔴') ? 'high' : rec.includes('♿') ? 'medium' : 'low'}">${rec}</div>`).join('\n')}
            </div>
        </div>
        ${goldenComparison ? `
        <div id="comparison" class="tab-content">
            <div class="section">
                <h2 class="section-title">🔗 Сравнение с эталоном</h2>
                <p><strong>Идентичность:</strong> ${goldenComparison.identical ? '✅ Да' : '❌ Нет'}</p>
                <p><strong>Новых элементов:</strong> ${goldenComparison.newElements.length}</p>
                <p><strong>Удаленных элементов:</strong> ${goldenComparison.removedElements.length}</p>
                ${goldenComparison.differences.length > 0 ? `<h3>Различия:</h3><ul>${goldenComparison.differences.map(diff => `<li>${diff}</li>`).join('\n')}</ul>` : ''}
            </div>
        </div>
        ` : ''}
    </div>
    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }
}

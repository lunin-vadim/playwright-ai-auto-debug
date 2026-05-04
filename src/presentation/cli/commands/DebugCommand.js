// src/presentation/cli/commands/DebugCommand.js

import { extractOption } from './extractOption.js';

export class DebugCommand {
  static commandName = 'debug';
  static description = 'Analyze test errors with AI assistance';
  static usage = 'debug [options]';
  static options = [
    '--use-mcp     Enable MCP DOM snapshots',
    '--project     Project directory (default: current)',
    '--parallel    Parallel AI workers (default: from config)',
    '--help        Show help for this command'
  ];

  constructor(container) {
    this.container = container;
  }

  async execute(args) {
    try {
      console.log('🏗️  Using Clean Architecture implementation');
      console.log('🔧 Initializing dependencies...');

      const testDebugService = await this.container.get('testDebugService');

      const projectPath = extractOption(args, '--project') || process.cwd();
      const useMcp = args.includes('--use-mcp');
      const parallelArg = extractOption(args, '--parallel');
      const parallel = parallelArg ? Math.max(1, Number(parallelArg)) : undefined;

      console.log(`📁 Project path: ${projectPath}`);
      console.log(`🔗 MCP enabled: ${useMcp}`);

      const results = await testDebugService.debugTests(projectPath, { useMcp, parallel });

      await this.displayResults(results);

      return results;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      if (error.message.includes('api_key')) {
        console.error('💡 Run "playwright-ai setup" to configure API key');
      }
      throw error;
    }
  }

  async displayResults(results) {
    console.log('\n📊 Analysis Results Summary:');
    console.log('─'.repeat(50));

    if (results.summary) {
      const s = results.summary;
      console.log(`📁 Total files: ${s.totalFiles}`);
      console.log(`✅ Processed: ${s.processedFiles}`);
      console.log(`❌ Errors: ${s.errorFiles}`);
      console.log(`📈 Success rate: ${s.successRate.toFixed(1)}%`);
      console.log(`🎯 Average confidence: ${s.averageConfidence.toFixed(1)}%`);
      console.log(`⏱️  Processing time: ${s.processingTimeMs}ms`);
      if (s.topErrorTypes.length > 0) {
        console.log(`🔍 Top error types: ${s.topErrorTypes.slice(0, 3).join(', ')}`);
      }
      if (s.totalActions > 0) console.log(`🎬 Total actions suggested: ${s.totalActions}`);
      if (s.totalRecommendations > 0) console.log(`💡 Total recommendations: ${s.totalRecommendations}`);
    }

    console.log('\n🏗️  Powered by Clean Architecture');

    if (results.success) {
      console.log('✅ Analysis completed successfully');
      await this.showReportLocations();
    } else {
      console.log('⚠️  Analysis completed with some errors');
    }
  }

  async showReportLocations() {
    try {
      const config = await this.container.get('config');
      const fs = await import('fs');
      const path = await import('path');
      const { glob } = await import('glob');

      console.log('\n📄 Где найти отчеты:');

      const reportDir = config.report_dir || 'playwright-report';
      if (fs.existsSync(reportDir)) {
        const htmlFiles = await glob(path.join(reportDir, 'ai-analysis-*.html'));
        if (htmlFiles.length > 0) {
          const latest = htmlFiles[htmlFiles.length - 1];
          console.log(`   🌐 HTML отчет: ${latest}`);
          console.log(`      💡 Откройте в браузере: open ${latest}`);
        }
      }

      const aiResponsesDir = config.ai_responses_dir || 'ai-responses';
      if (fs.existsSync(aiResponsesDir)) {
        const summaryFiles = await glob(path.join(aiResponsesDir, 'analysis-summary-*.md'));
        if (summaryFiles.length > 0) {
          console.log(`   📝 Сводный отчет: ${summaryFiles[summaryFiles.length - 1]}`);
        }
        const responseFiles = await glob(path.join(aiResponsesDir, 'ai-response-*.md'));
        if (responseFiles.length > 0) {
          console.log(`   📄 AI ответы: ${responseFiles.length} файлов в ${aiResponsesDir}/`);
        }
      }

      if (config.allure_integration) {
        const allureDir = config.allure_results_dir || 'allure-results';
        if (fs.existsSync(allureDir)) {
          console.log(`   📊 Allure attachments: ${allureDir}/`);
          console.log(`      💡 Запустите: npx allure serve ${allureDir}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Не удалось проверить отчеты: ${error.message}`);
    }
  }
}

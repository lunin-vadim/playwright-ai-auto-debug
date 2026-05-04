// src/presentation/cli/commands/DoctorCommand.js

import { extractOption } from './extractOption.js';

export class DoctorCommand {
  static commandName = 'doctor';
  static description = 'Check paths and required files based on ai.conf';
  static usage = 'doctor [--project <path>] [--fix] [--json]';
  static options = [
    '--project     Project directory (default: current)',
    '--fix         Create missing folders (no files)',
    '--json        Output JSON report'
  ];

  constructor(container) {
    this.container = container;
  }

  async execute(args) {
    const projectPath = extractOption(args, '--project') || process.cwd();
    const doFix = args.includes('--fix');
    const asJson = args.includes('--json');

    const fs = await import('fs');
    const path = await import('path');
    const { glob } = await import('glob');

    let config;
    try {
      config = await this.container.get('config');
    } catch (e) {
      config = {};
    }

    const resultsDir = path.join(projectPath, config.results_dir || 'test-results');
    const reportDir = path.join(projectPath, config.report_dir || 'playwright-report');
    const aiResponsesDir = path.join(projectPath, config.ai_responses_dir || 'ai-responses');
    const allureDir = path.join(projectPath, config.allure_results_dir || 'allure-results');
    const patterns = Array.isArray(config.error_file_patterns) && config.error_file_patterns.length
      ? config.error_file_patterns
      : ['**/error-context.md', 'copy-prompt.txt', 'error.txt', 'test-error.md', '*-error.txt', '*-error.md'];

    const checks = [];

    function ensureDir(dirPath) {
      const exists = fs.existsSync(dirPath);
      if (!exists && doFix) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return fs.existsSync(dirPath);
    }

    const dirsToCheck = [
      { key: 'results_dir', path: resultsDir },
      { key: 'report_dir', path: reportDir },
      { key: 'ai_responses_dir', path: aiResponsesDir },
    ];

    if (config.allure_integration) {
      dirsToCheck.push({ key: 'allure_results_dir', path: allureDir });
    }

    for (const item of dirsToCheck) {
      const ok = ensureDir(item.path);
      checks.push({ type: 'dir', key: item.key, path: item.path, ok });
    }

    const filesReport = [];
    try {
      for (const pattern of patterns) {
        const matches = await glob(path.join(resultsDir, pattern));
        filesReport.push({ pattern, count: matches.length, samples: matches.slice(0, 5) });
      }
    } catch (e) {
      // ignore glob errors
    }

    const expectedArtifacts = [
      { label: 'Playwright HTML report', path: path.join(reportDir, 'index.html') },
      { label: 'Allure results dir', path: allureDir, onlyIf: !!config.allure_integration },
    ];

    const artifacts = expectedArtifacts
      .filter(a => a.onlyIf === undefined || a.onlyIf)
      .map(a => ({ label: a.label, path: a.path, ok: fs.existsSync(a.path) }));

    const hasMissingDirs = checks.some(c => c.type === 'dir' && !c.ok);
    const hasNoErrorFiles = filesReport.every(fr => fr.count === 0);

    const summary = {
      projectPath,
      fixed: doFix,
      status: hasMissingDirs ? 'incomplete' : 'ok',
      hints: [
        hasMissingDirs ? 'Создайте недостающие директории или запустите с --fix' : null,
        hasNoErrorFiles ? 'Файлы ошибок не найдены — это нормально, если сейчас нет упавших тестов' : null,
      ].filter(Boolean)
    };

    if (asJson) {
      console.log(JSON.stringify({ summary, checks, files: filesReport, artifacts }, null, 2));
    } else {
      console.log('🩺 Environment Doctor\n');
      console.log(`📁 Project: ${projectPath}`);
      console.log(`🔧 Fix mode: ${doFix ? 'ON' : 'OFF'}`);
      console.log('\n📂 Directories:');
      for (const c of checks) {
        console.log(`  ${c.ok ? '✅' : '❌'} ${c.key.padEnd(18)} ${c.path}`);
      }
      console.log('\n📝 Error file patterns:');
      for (const fr of filesReport) {
        console.log(`  ${fr.count > 0 ? '✅' : '⚠️ '} ${fr.pattern} — найдено: ${fr.count}`);
        if (fr.samples.length > 0) {
          fr.samples.forEach(s => console.log(`     • ${path.relative(projectPath, s)}`));
        }
      }
      console.log('\n📦 Artifacts:');
      for (const a of artifacts) {
        console.log(`  ${a.ok ? '✅' : '⚠️ '} ${a.label}: ${a.path}`);
      }
      if (summary.hints.length) {
        console.log('\n💡 Hints:');
        summary.hints.forEach(h => console.log(`  • ${h}`));
      }
    }

    process.exitCode = hasMissingDirs ? 2 : 0;

    return { summary, checks, files: filesReport, artifacts };
  }
}

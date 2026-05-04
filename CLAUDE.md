# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`playwright-ai-auto-debug` (v3.2.4) is an NPM package that automatically debugs Playwright test failures using AI. It collects error files from test runs, sends them to an AI provider (OpenAI, Mistral, LocalAI/Ollama), and embeds the AI analysis back into HTML/Allure/Markdown reports. A secondary feature is UI Test Coverage Analysis — tracking which page elements are exercised by tests.

## Commands

### Root project (library development)
```bash
npm run build          # Compile src/ → lib/
npm run debug:cli      # Debug CLI entry point with Node inspector
npm run debug:main     # Debug compiled lib with Node inspector
npm run demo           # Run full demo via DemoProject
npm run version:patch  # Bump patch version
npm run release:github # Create GitHub release
```

### Demo project (`new-pw-ai/`)
```bash
cd new-pw-ai
npm test               # Run Playwright tests
npm run ai:debug       # Run AI analysis on last test results
npm run ai:debug:mcp   # AI analysis with MCP browser automation
npm run ui:coverage    # UI coverage analysis (single page)
npm run ui:coverage:all # All pages with golden comparison
npm run allure:generate && npm run allure:open  # View Allure report
npm run test:coverage  # Tests + coverage reports combined
```

### Running a single test
```bash
cd new-pw-ai
npx playwright test src/tests/example.spec.js
npx playwright test --grep "test name"
```

## Architecture

The library follows Clean Architecture with strict layer boundaries. Dependencies always point inward:

```
Infrastructure → Application → Domain
```

**Domain** (`src/domain/`) — pure business logic, no I/O:
- `TestError` — represents a test failure; contains severity scoring, keyword extraction, and relevance ranking logic
- `AIResponse` — represents an AI analysis result; parses action items, code snippets, and confidence scores
- `Report` — report entity
- `repositories/I*.js` — interfaces (contracts) that infrastructure must implement

**Application** (`src/application/`) — orchestration:
- `AnalyzeTestErrorsUseCase` — core use-case; collects errors, calls AI provider, writes responses; handles parallel processing
- `TestDebugService` — thin service wrapping the use case

**Infrastructure** (`src/infrastructure/`) — I/O and external systems:
- `ai/` — AI provider implementations (`OpenAIProvider`, `MistralProvider`, `LocalAIProvider`). All implement `IAIProvider`.
- `reporters/` — `HTMLReporter` (patches Playwright HTML report), `AllureReporter` (attaches AI notes), `MarkdownReporter`, `SummaryReporter`
- `coverage/` — UI test coverage: `testCoverageFixture` (Playwright fixture), `testElementTracker`, `globalCoverageTracker`
- `config/ConfigLoader` — loads `ai.conf.js`, merges env vars
- `di/Container` + `di/bindings` — DI container with singleton/transient/factory patterns; auto-detects AI provider from `api_key` and `ai_server`

**Presentation** (`src/presentation/cli/`):
- `CliApplication` — registers and dispatches all CLI commands (`debug`, `analyze`, `ui-coverage`, `coverage`, `setup`, `validate`, `doctor`, `info`)
- `CoverageCommand` — coverage-specific sub-commands (`init`, `info`)

**Entry points:**
- `bin/index.js` — `npx playwright-ai` CLI
- `src/main.js` — library bootstrap; `lib/` is the compiled output (not edited directly)

## Configuration

`ai.conf.js` in the project root is loaded at runtime. Key fields:

| Field | Purpose |
|-------|---------|
| `api_key` | AI provider key (reads `API_KEY` env var) |
| `ai_server` | Provider endpoint URL (determines which provider class is used) |
| `model` | Model name |
| `results_dir` | Where Playwright stores `error-context.md` / `error.txt` files |
| `allure_integration` | Attach AI analysis to Allure reports |
| `parallel_enabled` / `parallel_limit` | Concurrent AI requests (env: `PW_AI_PARALLEL`) |
| `summary_report_formats` | `['html', 'markdown', 'json']` |
| `mcp_integration` | Enable MCP browser automation (also via `--use-mcp` flag) |

AI provider is auto-detected in `bindings.js` by inspecting `ai_server` URL.

## Extending the Library

**Add a new AI provider:**
1. Create `src/infrastructure/ai/NewProvider.js` implementing `IAIProvider` (has `analyze(errors)` method)
2. Register it in `src/infrastructure/di/bindings.js` by adding a URL pattern check

**Add a new reporter:**
1. Create `src/infrastructure/reporters/NewReporter.js` implementing `IReporter`
2. Register in `di/bindings.js` and wire into `AnalyzeTestErrorsUseCase`

**Add a new CLI command:**
1. Add a method to `CliApplication.js` and register it in the `commands` map in the constructor

## Code Style

- ES module syntax (`import`/`export`) throughout
- No TypeScript — plain JS with JSDoc where needed
- Comments describe *why*, not what
- Commit messages use emoji prefix (e.g. `🔧`, `fix:`, `feat:`)
- Do not push changes without explicit approval

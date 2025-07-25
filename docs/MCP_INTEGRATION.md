# 🔗 Playwright MCP Integration

Интеграция с Playwright MCP (Model Context Protocol) для получения структурированной информации о DOM и валидации AI предложений через браузерную автоматизацию.

## 🚀 Быстрый старт

### Включение MCP режима

```bash
# Стандартный режим (без MCP)
npx playwright-ai

# MCP режим с DOM snapshots
npx playwright-ai --use-mcp

# Кастомная директория проекта
npx playwright-ai --project ./tests --use-mcp
```

### Требования

- Node.js >= 16.0.0
- Playwright установлен в проекте
- Доступ к `npx @playwright/mcp@latest`

## 📸 Как работает MCP

### 1. Автоматический запуск MCP сервера

При использовании флага `--use-mcp`:
- Автоматически запускается `npx @playwright/mcp@latest`
- Устанавливается WebSocket соединение на порт 3001
- Проверяется готовность сервера к работе

### 2. Получение DOM snapshot

```javascript
// MCP запрос для получения структуры страницы
const snapshot = await mcpClient.getSnapshot();

// Результат содержит элементы с ref, role, name, text, selector
{
  elements: [
    {
      ref: "element_1",
      role: "button",
      name: "Submit",
      text: "Submit Form",
      selector: "button[type='submit']",
      attributes: { ... }
    },
    // ...
  ]
}
```

### 3. Включение в AI промпт

DOM snapshot автоматически включается в запрос к AI:

```
Here's an error from a Playwright test:

[Исходная ошибка]

## 📸 DOM Snapshot (15 elements)

The current page structure:
- Element element_1: role="button" name="Submit" text="Submit Form" selector="button[type='submit']"
- Element element_2: role="textbox" name="Email" selector="input[type='email']"
...

**Note:** Use the exact element references (ref) from the snapshot when suggesting fixes.
```

### 4. Валидация AI предложений

AI ответы автоматически анализируются и валидируются:

```javascript
// Парсинг Playwright команд из AI ответа
const actions = parseActions(aiResponse);
// [{ type: 'click', selector: 'button[type="submit"]', ... }]

// Конвертация в MCP формат
const mcpActions = convertToMcpActions(actions, snapshot);
// [{ type: 'click', ref: 'element_1', ... }]

// Выполнение через MCP для валидации
const results = await mcpClient.validateActions(mcpActions);
```

## ⚙️ Конфигурация

### ai.conf.js

```javascript
export const ai_conf = {
  // Основные настройки...
  
  // MCP Integration
  mcp_integration: false,        // Включается флагом --use-mcp
  mcp_ws_host: 'localhost',      // WebSocket хост
  mcp_ws_port: 3001,            // WebSocket порт
  mcp_timeout: 30000,           // Таймаут запросов (мс)
  mcp_retry_attempts: 3,        // Количество попыток подключения
  mcp_command: 'npx',           // Команда для запуска MCP
  mcp_args: ['@playwright/mcp@latest'], // Аргументы команды
};
```

### Переменные окружения

```bash
# Порт для MCP WebSocket (опционально)
MCP_WS_PORT=3001
```

## 🧪 Валидация действий

### Поддерживаемые действия

- **Click**: `page.click()`, `locator.click()`, `getByRole().click()`
- **Fill**: `page.fill()`, `locator.fill()`, `getByRole().fill()`
- **WaitFor**: `page.waitForSelector()`, `locator.waitFor()`

### Система скоринга

Действия оцениваются по надежности селекторов:
- `getByRole()` - высокий приоритет (+0.3)
- `getByTestId()` - высокий приоритет (+0.25)
- `getByText()` - средний приоритет (+0.2)
- CSS селекторы - низкий приоритет (-0.1)

### Результаты валидации

В AI ответе автоматически добавляется секция:

```markdown
## 🧪 MCP Validation Results
- **Actions tested:** 3
- **Successful:** 2
- **Success rate:** 67%

✅ **High confidence:** Actions validated successfully through MCP
```

## 🔧 Troubleshooting

### MCP сервер не запускается

```bash
# Проверьте доступность MCP
npx @playwright/mcp@latest --version

# Проверьте порт
lsof -i :3001
```

### WebSocket ошибки подключения

- Убедитесь что порт 3001 свободен
- Проверьте firewall настройки
- Увеличьте `mcp_timeout` в конфигурации

### Нет DOM элементов в snapshot

- Убедитесь что браузер открыт на нужной странице
- Проверьте что страница полностью загружена
- Убедитесь что нет JavaScript ошибок

### Fallback в стандартный режим

При любых ошибках MCP автоматически отключается:

```
⚠️  MCP client failed to start, falling back to standard mode
```

Это нормальное поведение - анализ продолжится без DOM snapshots.

## 📊 Логирование

### MCP операции

```
🚀 Starting Playwright MCP server...
📦 Spawning: npx @playwright/mcp@latest
🔗 MCP server is ready
🔌 Connecting to MCP WebSocket: ws://localhost:3001
✅ WebSocket connected to MCP server
📸 Requesting DOM snapshot from MCP...
✅ DOM snapshot received: 15 elements
```

### Валидация действий

```
🔍 Parsing actions from AI response...
📋 Found 3 potential actions
✅ Mapped action: click -> ref:element_1
🧪 Validating 2 actions through MCP...
🖱️  Performing click via MCP: element_1
✅ Click action completed
✅ MCP validation: 2/2 actions successful (100%)
```

## 🎯 Best Practices

### 1. Используйте семантические селекторы

```javascript
// ✅ Хорошо - будет найдено в snapshot
await page.getByRole('button', { name: 'Submit' }).click();

// ❌ Плохо - может не совпадать с snapshot
await page.click('#btn-123');
```

### 2. Проверяйте результаты валидации

Обращайте внимание на секцию "MCP Validation Results" в AI ответах - она показывает реальную применимость предложений.

### 3. Настройте таймауты

Для медленных страниц увеличьте `mcp_timeout`:

```javascript
mcp_timeout: 60000, // 60 секунд
```

## 🔄 Архитектура

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│ playwright-ai   │───▶│ MCP Server   │───▶│ Browser     │
│ CLI             │    │ (WebSocket)  │    │ (Playwright)│
└─────────────────┘    └──────────────┘    └─────────────┘
         │                       │                  │
         ▼                       ▼                  ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│ DOM Snapshot    │───▶│ AI Analysis  │───▶│ Action      │
│ (Structured)    │    │ (Enhanced)   │    │ Validation  │
└─────────────────┘    └──────────────┘    └─────────────┘
```

---

Для получения помощи используйте:
```bash
playwright-ai --help
``` 
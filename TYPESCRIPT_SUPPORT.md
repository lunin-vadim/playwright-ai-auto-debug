# TypeScript Configuration Support

## Проблема

Ошибка `Unknown file extension ".ts"` возникает когда Node.js пытается импортировать TypeScript файл конфигурации без соответствующих инструментов.

## Решения

### Вариант 1: Установить tsx (Рекомендуется)

```bash
npm install tsx
```

После установки `tsx` ваш `playwright.config.ts` будет автоматически поддерживаться.

### Вариант 2: Переименовать в JavaScript

1. Переименуйте `playwright.config.ts` в `playwright.config.js`
2. Удалите TypeScript типы из конфигурации:

```javascript
// Было (TypeScript)
import { defineConfig, PlaywrightTestConfig } from '@playwright/test';

export default defineConfig({
  // конфигурация
});

// Стало (JavaScript)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // конфигурация
});
```

### Вариант 3: Использовать готовый пример

Скопируйте `playwright.config.example.js` в `playwright.config.js`:

```bash
cp playwright.config.example.js playwright.config.js
```

## Проверка

После применения любого из решений запустите:

```bash
npx playwright-ai
```

Вы должны увидеть сообщение:
```
✅ AI configuration loaded from playwright.config.js
```
или
```
✅ AI configuration loaded from playwright.config.ts
```

## Автоматическое определение

Инструмент автоматически:
1. Ищет `playwright.config.ts` сначала
2. Если не найден, ищет `playwright.config.js`
3. Для TypeScript файлов проверяет доступность `tsx`
4. Предоставляет понятные сообщения об ошибках 
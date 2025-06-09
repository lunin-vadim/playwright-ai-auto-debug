# @playwright-ai/auto-debug

🤖 Автоматическая отладка Playwright тестов с помощью Mistral AI

## 📦 Установка

```bash
npm install @playwright-ai/auto-debug
```

## 🔧 Настройка

Создайте файл `.env` в корне проекта и добавьте ваш API ключ Mistral:

```env
MISTRAL_API_KEY=ваш_api_ключ_здесь
```

Или экспортируйте переменную окружения:

```bash
export MISTRAL_API_KEY=ваш_api_ключ_здесь
```

## 🚀 Использование

### CLI команда

```bash
npx playwright-ai
```

### Через npm scripts

Добавьте в `package.json`:

```json
{
  "scripts": {
    "debug:ai": "npx playwright-ai"
  }
}
```

Затем запустите:

```bash
npm run debug:ai
```

## 🔍 Как это работает

1. **Поиск ошибок**: Автоматически находит все файлы `copy-prompt.txt` в папке `test-results/`
2. **AI анализ**: Отправляет содержимое ошибок в Mistral AI для получения решений
3. **Обновление отчетов**: Добавляет блок с ошибкой и решением в HTML отчеты Playwright

## 📋 Пример результата

После выполнения команды в ваших HTML отчетах появится блок:

```html
<div class="ai-debug">
  <h3>🔍 AI Debug</h3>
  <p><strong>Ошибка:</strong> Error: Timeout while waiting for selector...</p>
  <p><strong>Решение от AI:</strong> Попробуйте добавить ожидание перед этим шагом...</p>
</div>
```

## 📊 Логи выполнения

```bash
🚀 Запуск автоматической отладки Playwright тестов...

🔍 Поиск файлов с ошибками...
✅ Найден prompt: test-results/test1/copy-prompt.txt
✅ Найден prompt: test-results/test2/copy-prompt.txt
📋 Найдено 2 файл(ов) с ошибками

📝 Обработка 1/2: test-results/test1/copy-prompt.txt
🔁 Отправлено в Mistral...
✅ Ответ получен
💾 HTML обновлён: test-results/test1/index.html

📝 Обработка 2/2: test-results/test2/copy-prompt.txt
🔁 Отправлено в Mistral...
✅ Ответ получен
💾 HTML обновлён: test-results/test2/index.html

✅ Отладка завершена успешно!
```

## ⚙️ Требования

- Node.js >= 16.0.0
- Mistral API ключ
- Playwright тесты с сгенерированными отчетами

## 🔒 Безопасность

- API ключ не сохраняется в коде
- Добавьте `.env` в `.gitignore`
- Соблюдается rate limiting для API запросов

## 📄 Лицензия

MIT 
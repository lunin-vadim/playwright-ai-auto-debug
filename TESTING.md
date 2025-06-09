# 🧪 Локальное тестирование библиотеки

## 📋 Быстрый старт

1. **Установка зависимостей**:
   ```bash
   npm install
   ```

2. **Настройка API ключа**:
   ```bash
   echo "MISTRAL_API_KEY=ваш_ключ" > .env
   ```

3. **Запуск полного теста**:
   ```bash
   npm run demo
   ```

## 🔧 Доступные команды

### Основные команды
- `npm run test:local` - запуск библиотеки с тестовыми данными
- `npm run clean:test` - очистка AI-блоков из HTML отчетов
- `npm run demo` - полный цикл: очистка + тестирование

### CLI команды
- `npx playwright-ai` - запуск через npm link
- `node test-local.js` - прямой запуск без npm link

## 📁 Тестовые данные

Проект содержит готовые тестовые данные:

```
test-results/
├── test-example-1/
│   ├── copy-prompt.txt    # Ошибка timeout
│   └── index.html         # HTML отчет
└── test-example-2/
    ├── copy-prompt.txt    # Ошибка assertion
    └── index.html         # HTML отчет
```

## ✅ Что проверить

1. **Поиск файлов**: Библиотека находит все `copy-prompt.txt`
2. **API запросы**: Успешные запросы к Mistral AI
3. **HTML обновление**: AI-блоки добавляются в отчеты
4. **Логирование**: Подробные сообщения о процессе

## 🎯 Ожидаемый результат

После запуска в HTML отчетах появятся блоки:

```html
<div class="ai-debug">
  <h3>🔍 AI Debug</h3>
  <div>Ошибка: [текст ошибки]</div>
  <div>Решение от AI: [конкретные рекомендации]</div>
</div>
```

## 🔍 Проверка в браузере

Откройте HTML файлы в браузере:
```bash
open test-results/test-example-1/index.html
open test-results/test-example-2/index.html
```

## 🐛 Отладка

### Проблемы с API
- Проверьте `.env` файл с MISTRAL_API_KEY
- Убедитесь в наличии интернет-соединения

### Проблемы с файлами
- Убедитесь что папка `test-results/` существует
- Проверьте права доступа к файлам

### Проблемы с зависимостями
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 Пример успешного вывода

```
🚀 Запуск автоматической отладки Playwright тестов...

🔍 Поиск файлов с ошибками...
✅ Найден prompt: test-results/test-example-1/copy-prompt.txt
✅ Найден prompt: test-results/test-example-2/copy-prompt.txt
📋 Найдено 2 файл(ов) с ошибками

📝 Обработка 1/2: test-results/test-example-1/copy-prompt.txt
🔁 Отправлено в Mistral...
✅ Ответ получен
💾 HTML обновлён: test-results/test-example-1/index.html

📝 Обработка 2/2: test-results/test-example-2/copy-prompt.txt
🔁 Отправлено в Mistral...
✅ Ответ получен
💾 HTML обновлён: test-results/test-example-2/index.html

✅ Отладка завершена успешно! 
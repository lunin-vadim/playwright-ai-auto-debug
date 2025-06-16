#!/bin/bash

# Скрипт для установки конфигурации отладки в другой проект
# Использование: ./setup-debug.sh /path/to/target/project

if [ $# -eq 0 ]; then
    echo "Использование: $0 <путь_к_проекту>"
    echo "Пример: $0 /Users/username/my-project"
    exit 1
fi

TARGET_DIR="$1"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Ошибка: Директория $TARGET_DIR не существует"
    exit 1
fi

echo "Установка конфигурации отладки в: $TARGET_DIR"

# Создаем папку .vscode если её нет
mkdir -p "$TARGET_DIR/.vscode"

# Копируем конфигурацию
cp "debug-config-template/.vscode/launch.json" "$TARGET_DIR/.vscode/"
cp "debug-config-template/.vscode/settings.json" "$TARGET_DIR/.vscode/"

echo "✅ Конфигурация отладки установлена!"
echo ""
echo "Следующие шаги:"
echo "1. Откройте проект в VS Code: code '$TARGET_DIR'"
echo "2. Нажмите Ctrl+Shift+D для открытия панели отладки"
echo "3. Выберите нужную конфигурацию и нажмите F5"
echo ""
echo "Возможно потребуется настроить:"
echo "- Путь к главному файлу в launch.json"
echo "- Аргументы командной строки"
echo "- Переменные окружения" 
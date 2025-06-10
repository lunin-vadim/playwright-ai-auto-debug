/**
 * Конфигурация AI для автоматической отладки
 */
export interface AiConfig {
  /** API ключ для AI сервиса (обязательно) */
  api_key: string;
  
  /** URL AI сервера (по умолчанию: 'https://api.mistral.ai') */
  ai_server?: string;
  
  /** Модель AI для анализа (по умолчанию: 'mistral-medium') */
  model?: string;
  
  /** Папка с результатами тестов (по умолчанию: 'test-results') */
  results_dir?: string;
  
  /** Папка с HTML отчетами (по умолчанию: 'playwright-report') */
  report_dir?: string;
  
  /** Максимальная длина промпта (по умолчанию: 2000) */
  max_prompt_length?: number;
  
  /** Задержка между запросами в мс (по умолчанию: 1000) */
  request_delay?: number;
  
  /** Паттерны файлов с ошибками для поиска (по умолчанию: ['copy-prompt.txt', 'error-context.md', ...]) */
  error_file_patterns?: string[];
  
  /** Кастомные сообщения для AI */
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

// Подключаем глобальные типы
import './global'; 
// src/infrastructure/di/Container.js

/**
 * Dependency Injection контейнер
 * Управляет созданием и жизненным циклом зависимостей
 */
export class Container {
  constructor() {
    this.bindings = new Map();
    this.instances = new Map();
    this.singletons = new Set();
    this.factories = new Map();
  }

  /**
   * Регистрирует привязку зависимости
   * @param {string} key - ключ зависимости
   * @param {Function} factory - фабричная функция
   * @param {Object} options - опции (singleton, transient)
   */
  bind(key, factory, options = {}) {
    if (typeof factory !== 'function') {
      throw new Error(`Factory for ${key} must be a function`);
    }

    this.bindings.set(key, factory);
    this.factories.set(key, options);

    if (options.singleton !== false) {
      this.singletons.add(key);
    }

    return this;
  }

  /**
   * Регистрирует singleton привязку
   * @param {string} key - ключ зависимости
   * @param {Function} factory - фабричная функция
   */
  singleton(key, factory) {
    return this.bind(key, factory, { singleton: true });
  }

  /**
   * Регистрирует transient привязку (новый экземпляр каждый раз)
   * @param {string} key - ключ зависимости
   * @param {Function} factory - фабричная функция
   */
  transient(key, factory) {
    return this.bind(key, factory, { singleton: false });
  }

  /**
   * Регистрирует константу
   * @param {string} key - ключ
   * @param {*} value - значение
   */
  constant(key, value) {
    this.instances.set(key, value);
    this.singletons.add(key);
    return this;
  }

  /**
   * Получает экземпляр зависимости
   * @param {string} key - ключ зависимости
   * @returns {*} - экземпляр
   */
  get(key) {
    // Проверяем кэш для singleton'ов
    if (this.singletons.has(key) && this.instances.has(key)) {
      return this.instances.get(key);
    }

    // Получаем фабрику
    const factory = this.bindings.get(key);
    if (!factory) {
      throw new Error(`No binding found for: ${key}`);
    }

    try {
      // Создаем экземпляр
      const instance = factory(this);

      // Кэшируем для singleton'ов
      if (this.singletons.has(key)) {
        this.instances.set(key, instance);
      }

      return instance;
    } catch (error) {
      throw new Error(`Failed to resolve dependency '${key}': ${error.message}`);
    }
  }

  /**
   * Проверяет, зарегистрирована ли зависимость
   * @param {string} key - ключ зависимости
   * @returns {boolean}
   */
  has(key) {
    return this.bindings.has(key) || this.instances.has(key);
  }

  /**
   * Создает дочерний контейнер
   * @returns {Container}
   */
  createChild() {
    const child = new Container();
    
    // Наследуем привязки родителя
    for (const [key, factory] of this.bindings) {
      child.bindings.set(key, factory);
      
      if (this.singletons.has(key)) {
        child.singletons.add(key);
      }
      
      const options = this.factories.get(key);
      if (options) {
        child.factories.set(key, options);
      }
    }

    // Наследуем экземпляры singleton'ов
    for (const [key, instance] of this.instances) {
      if (this.singletons.has(key)) {
        child.instances.set(key, instance);
      }
    }

    return child;
  }

  /**
   * Очищает все зависимости
   */
  clear() {
    // Вызываем dispose для экземпляров, которые это поддерживают
    for (const [key, instance] of this.instances) {
      if (instance && typeof instance.dispose === 'function') {
        try {
          instance.dispose();
        } catch (error) {
          console.warn(`Error disposing ${key}:`, error);
        }
      }
    }

    this.bindings.clear();
    this.instances.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  /**
   * Получает информацию о зарегистрированных зависимостях
   * @returns {Object}
   */
  getRegistrationInfo() {
    const info = {
      bindings: [],
      instances: [],
      singletons: Array.from(this.singletons)
    };

    for (const key of this.bindings.keys()) {
      const options = this.factories.get(key) || {};
      info.bindings.push({
        key,
        isSingleton: this.singletons.has(key),
        hasInstance: this.instances.has(key),
        options
      });
    }

    for (const key of this.instances.keys()) {
      if (!this.bindings.has(key)) {
        info.instances.push({
          key,
          type: 'constant'
        });
      }
    }

    return info;
  }

  /**
   * Автоматическое внедрение зависимостей в класс
   * @param {Function} TargetClass - класс для инжекции
   * @param {string[]} dependencies - массив ключей зависимостей
   * @returns {*} - экземпляр класса с внедренными зависимостями
   */
  inject(TargetClass, dependencies = []) {
    const resolvedDependencies = dependencies.map(dep => this.get(dep));
    return new TargetClass(...resolvedDependencies);
  }

  /**
   * Создает декоратор для автоматического внедрения зависимостей
   * @param {string[]} dependencies - массив ключей зависимостей
   * @returns {Function} - декоратор
   */
  createInjectionDecorator(dependencies) {
    return (TargetClass) => {
      return (...args) => {
        const resolvedDependencies = dependencies.map(dep => this.get(dep));
        return new TargetClass(...resolvedDependencies, ...args);
      };
    };
  }

  /**
   * Регистрирует множественные привязки одного типа
   * @param {string} key - ключ для группы
   * @param {string} itemKey - ключ элемента
   * @param {Function} factory - фабрика элемента
   */
  bindToGroup(key, itemKey, factory) {
    const groupKey = `group:${key}`;
    
    if (!this.bindings.has(groupKey)) {
      this.bind(groupKey, () => new Map());
    }

    const group = this.get(groupKey);
    group.set(itemKey, factory(this));

    return this;
  }

  /**
   * Получает все элементы группы
   * @param {string} key - ключ группы
   * @returns {Map} - карта элементов группы
   */
  getGroup(key) {
    const groupKey = `group:${key}`;
    return this.get(groupKey);
  }

  /**
   * Создает middleware для обработки создания экземпляров
   * @param {Function} middleware - функция middleware
   */
  addMiddleware(middleware) {
    if (!this.middlewares) {
      this.middlewares = [];
    }
    this.middlewares.push(middleware);
  }

  /**
   * Применяет middleware к экземпляру
   * @param {string} key - ключ зависимости
   * @param {*} instance - экземпляр
   * @returns {*} - обработанный экземпляр
   */
  applyMiddlewares(key, instance) {
    if (!this.middlewares) {
      return instance;
    }

    return this.middlewares.reduce((acc, middleware) => {
      return middleware(key, acc, this);
    }, instance);
  }
} 
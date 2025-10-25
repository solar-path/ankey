# Vitest Setup - Установка и Настройка

## Выполненные шаги

### 1. Установка зависимостей ✅

```bash
bun add -d vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

**Установленные пакеты:**
- `vitest` - основной тестовый фреймворк
- `@vitest/ui` - UI интерфейс для Vitest
- `@testing-library/react` - утилиты для тестирования React компонентов
- `@testing-library/jest-dom` - дополнительные матчеры для DOM
- `@testing-library/user-event` - симуляция действий пользователя
- `jsdom` - DOM окружение для тестов
- `happy-dom` - альтернативное DOM окружение

### 2. Конфигурация Vitest ✅

Создан файл [vitest.config.ts](vitest.config.ts):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. Setup файл для тестов ✅

Создан файл [src/test/setup.ts](src/test/setup.ts) с:
- Импортом `@testing-library/jest-dom`
- Автоматической очисткой после каждого теста
- Моками для `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`
- Моком для `localStorage`
- Моком для `PouchDB` (загружается через CDN)

### 4. Обновлен package.json ✅

Добавлены скрипты для запуска тестов:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 5. Создан comprehensive тест для signin.page.tsx ✅

Файл [src/modules/auth/signin.page.test.tsx](src/modules/auth/signin.page.test.tsx) содержит 15+ тестов:

#### Rendering Tests (Тесты отображения)
- ✅ Проверка отображения формы входа
- ✅ Проверка ссылки "Forgot password"
- ✅ Проверка ссылки "Sign up"

#### Validation Tests (Тесты валидации)
- ✅ Валидация невалидного email
- ✅ Валидация отсутствующего пароля

#### Sign In Flow Tests (Тесты процесса входа)
- ✅ Успешный вход с корректными данными
- ✅ Обработка ошибок при неверных данных
- ✅ Блокировка UI во время отправки

#### Two-Factor Authentication Tests (Тесты 2FA)
- ✅ Отображение 2FA формы
- ✅ Успешная верификация кода
- ✅ Обработка неверного кода
- ✅ Возврат к форме входа
- ✅ Валидация длины кода

## Использование

### Запуск всех тестов

```bash
# Watch mode (по умолчанию)
bun run test

# Однократный запуск
bun run test run

# С UI интерфейсом
bun run test:ui

# С покрытием кода
bun run test:coverage
```

### Запуск конкретного теста

```bash
# Один файл
bun run test src/modules/auth/signin.page.test.tsx

# По паттерну
bun run test auth

# С фильтром по имени теста
bun run test -t "should render"
```

### Режимы работы Vitest

1. **Watch mode** (по умолчанию) - автоматически перезапускает тесты при изменении файлов
2. **Run mode** - запускает тесты один раз и завершается
3. **UI mode** - открывает веб-интерфейс для интерактивной работы с тестами

## Структура тестового файла

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Моки
vi.mock('./auth-service');
vi.mock('sonner');
vi.mock('wouter', () => ({...}));

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Group', () => {
    it('should do something', async () => {
      const user = userEvent.setup();
      render(<Component />);

      // Arrange
      const button = screen.getByRole('button');

      // Act
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });
});
```

## Best Practices

### 1. Используйте userEvent вместо fireEvent

```typescript
// ❌ Плохо
fireEvent.click(button);

// ✅ Хорошо
const user = userEvent.setup();
await user.click(button);
```

### 2. Тестируйте поведение, не реализацию

```typescript
// ❌ Плохо - тестирование внутренней реализации
expect(component.state.isLoading).toBe(true);

// ✅ Хорошо - тестирование видимого поведения
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### 3. Используйте accessible queries

```typescript
// Приоритет queries (от лучших к худшим):
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/enter email/i)
screen.getByText(/hello/i)
screen.getByTestId('custom-element') // Последний выбор
```

### 4. Используйте waitFor для асинхронных операций

```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### 5. Очищайте моки перед каждым тестом

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Troubleshooting

### Проблема: Тесты долго запускаются

**Возможные причины:**
1. Большое количество файлов для сканирования
2. Проблемы с watch mode в Bun runtime
3. Конфликт с другими процессами

**Решения:**
```bash
# Используйте Node.js вместо Bun для запуска тестов
NODE_ENV=test npx vitest run

# Запускайте тесты без watch mode
bun run test run

# Ограничьте количество workers
bun run test --max-workers=2
```

### Проблема: Cannot find module '@/...'

**Решение:** Убедитесь, что alias настроен в:
- `vitest.config.ts`
- `tsconfig.json`
- `vite.config.ts`

### Проблема: window is not defined

**Решение:** Проверьте, что в `vitest.config.ts` установлен `environment: 'jsdom'`

### Проблема: PouchDB is not defined

**Решение:** Мок для PouchDB уже добавлен в `src/test/setup.ts`. Если проблема остается, проверьте, что setupFiles указан в конфигурации.

## Дополнительные фичи Vitest

### Snapshots

```typescript
import { expect, it } from 'vitest';

it('matches snapshot', () => {
  const component = render(<MyComponent />);
  expect(component).toMatchSnapshot();
});
```

### Code Coverage

```bash
# Запустить с покрытием
bun run test:coverage

# Отчет будет в coverage/index.html
```

### Параллельное выполнение

По умолчанию Vitest запускает тесты параллельно. Для последовательного выполнения:

```typescript
describe.sequential('tests', () => {
  it('runs first', () => {});
  it('runs second', () => {});
});
```

### Only и Skip

```typescript
// Запустить только этот тест
it.only('this test', () => {});

// Пропустить этот тест
it.skip('skip this', () => {});

// Пропустить всю группу
describe.skip('group', () => {});
```

## Следующие шаги

1. ✅ Установка и настройка Vitest - **Завершено**
2. ✅ Создание тестов для signin.page.tsx - **Завершено**
3. 🔄 Добавьте тесты для других страниц auth модуля:
   - `signup.page.tsx`
   - `verifyAccount.page.tsx`
   - `forgotPassword.page.tsx`
4. 🔄 Создайте тесты для auth-service.ts
5. 🔄 Добавьте интеграционные тесты
6. 🔄 Настройте CI/CD для автоматического запуска тестов

## Полезные ссылки

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro/)
- [Common Mistakes with Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Заметки

- Vitest совместим с Jest API, поэтому большинство Jest тестов будут работать без изменений
- Vitest быстрее Jest благодаря использованию Vite
- Поддержка TypeScript из коробки
- Hot Module Replacement для тестов (instant feedback)
- Совместимость с Bun и Node.js

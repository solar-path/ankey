# Тестирование модуля Authentication

## Установка и настройка Vitest

Vitest установлен и настроен для проекта. Все необходимые зависимости добавлены.

### Установленные пакеты:

```bash
bun add -d vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

## Конфигурация

### vitest.config.ts
Конфигурация Vitest находится в корне проекта и включает:
- Поддержку React через `@vitejs/plugin-react`
- Окружение `jsdom` для тестирования компонентов
- Настройку алиасов (`@` указывает на `./src`)
- Файл setup для глобальных моков

### src/test/setup.ts
Файл настройки тестов включает:
- Импорт `@testing-library/jest-dom` для дополнительных матчеров
- Автоматическую очистку после каждого теста
- Моки для `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`
- Мок для `localStorage`
- Мок для `PouchDB` (так как он загружается через CDN)

## Доступные команды

```bash
# Запуск тестов
bun run test

# Запуск тестов с UI интерфейсом
bun run test:ui

# Запуск тестов с покрытием кода
bun run test:coverage
```

## Тесты для signin.page.tsx

Файл `signin.page.test.tsx` содержит comprehensive набор тестов для страницы входа:

### Тестируемые сценарии:

#### 1. Rendering (Отображение)
- ✅ Отображение формы входа со всеми полями
- ✅ Отображение ссылки "Forgot password"
- ✅ Отображение ссылки "Sign up"

#### 2. Form Validation (Валидация формы)
- ✅ Проверка невалидного email
- ✅ Проверка отсутствующего пароля

#### 3. Sign In Flow (Процесс входа)
- ✅ Успешный вход с корректными данными
- ✅ Отображение ошибки при неверных данных
- ✅ Блокировка кнопки во время отправки формы

#### 4. Two-Factor Authentication (Двухфакторная аутентификация)
- ✅ Отображение формы 2FA при необходимости
- ✅ Успешная верификация 2FA кода
- ✅ Отображение ошибки при неверном коде
- ✅ Возврат к форме входа из 2FA
- ✅ Блокировка кнопки до ввода 6 цифр

## Структура теста

```typescript
describe('SignInPage', () => {
  beforeEach(() => {
    // Очистка моков перед каждым тестом
    vi.clearAllMocks();
  });

  it('should render sign in form', () => {
    render(<SignInPage />);
    // Проверки...
  });
});
```

## Мокирование зависимостей

Тесты используют следующие моки:

```typescript
// Мок AuthService
vi.mock('./auth-service');

// Мок toast уведомлений
vi.mock('sonner');

// Мок роутера wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/auth/signin', vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Мок контекста аутентификации
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));
```

## Пример использования

### Тестирование успешного входа:

```typescript
it('should successfully sign in', async () => {
  const user = userEvent.setup();

  vi.mocked(AuthService.signIn).mockResolvedValue({
    user: { id: '1', email: 'test@example.com' },
    session: { id: 's1', token: 'token' },
    requires2FA: false,
  });

  render(<SignInPage />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(AuthService.signIn).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });
});
```

## Рекомендации по написанию тестов

1. **Используйте userEvent** вместо fireEvent для более реалистичной симуляции действий пользователя
2. **Всегда очищайте моки** в `beforeEach` хуке
3. **Используйте waitFor** для асинхронных операций
4. **Тестируйте поведение, а не реализацию** - проверяйте, что видит пользователь
5. **Группируйте тесты логически** используя вложенные `describe` блоки
6. **Давайте понятные имена тестам** - используйте формат "should [expected behavior]"

## Troubleshooting

### Проблема: Тесты зависают при запуске
**Решение:** Убедитесь, что все моки настроены корректно, особенно для PouchDB

### Проблема: Cannot find module '@/...'
**Решение:** Проверьте, что алиас настроен в `vitest.config.ts` и `tsconfig.json`

### Проблема: window.matchMedia is not a function
**Решение:** Мок для matchMedia уже добавлен в `src/test/setup.ts`

## Следующие шаги

1. Запустите тесты: `bun run test`
2. Просмотрите результаты в консоли
3. Для интерактивного режима используйте: `bun run test:ui`
4. Добавляйте новые тесты по мере разработки новых функций

## Дополнительные ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

# Refactoring Summary - State Management & Module Organization

## Что было сделано

### 1. ✅ Установлены зависимости
- `zustand@5.0.8` - State management
- `@hono/node-server@1.19.5` - Backend server

### 2. ✅ Создан Hono API Backend

**Файлы:**
- `src/api/api.hono.ts` - API routes и handlers
- `src/api/server.ts` - Server entry point
- `src/api/mail.settings.ts` - Email templates (уже был)

**Endpoints:**
```
POST /api/auth/send-verification
  - Отправляет verification email с кодом
  - Body: { email: string, code: string }

POST /api/auth/send-password-reset
  - Отправляет password reset email с токеном
  - Body: { email: string, resetToken: string }

GET /health
  - Health check endpoint
```

**Запуск:**
```bash
# API + Frontend одновременно
bun run dev

# Только API (port 3001)
bun run dev:api

# Только Frontend (port 5173)
bun run dev:vite
```

### 3. ✅ Реорганизована структура модулей

**До:**
```
src/lib/
  ├── auth-service.ts
  ├── db.ts
  ├── reference-data.ts
  ├── auth-context.tsx (Context API)
  ├── company-context.tsx (Context API)
  ├── breadcrumb-context.tsx (Context API)
  └── task-context.tsx (Context API)
```

**После:**
```
src/modules/
  ├── auth/
  │   ├── auth-service.ts          # Business logic
  │   ├── auth.valibot.ts          # Validation
  │   └── *.page.tsx               # Pages
  │
  ├── company/
  │   └── companyDashboard.page.tsx
  │
  └── shared/
      ├── database/                 # PouchDB layer
      │   ├── db.ts                # Users, Sessions
      │   ├── reference-data.ts    # Countries, Industries
      │   └── index.ts
      │
      └── stores/                   # Zustand stores
          ├── auth.store.ts        # Auth UI state
          ├── company.store.ts     # Company selection
          ├── breadcrumb.store.ts  # Breadcrumbs
          ├── task.store.ts        # Task list
          └── index.ts

src/lib/
  ├── auth-context.tsx             # Legacy wrapper (uses Zustand)
  ├── company-context.tsx          # Legacy wrapper
  ├── breadcrumb-context.tsx       # Legacy wrapper
  ├── task-context.tsx             # Legacy wrapper
  └── ui/                          # Shadcn components (unchanged)
```

### 4. ✅ Создан Zustand Stores

**Преимущества Zustand над Context API:**
- ✅ Лучшая производительность (нет лишних ре-рендеров)
- ✅ Встроенная поддержка persistence (localStorage)
- ✅ Проще тестировать
- ✅ Меньше boilerplate кода
- ✅ Dev Tools support

**Созданные stores:**

1. **auth.store.ts** - Authentication state
   ```typescript
   const { user, isAuthenticated, login, logout } = useAuthStore();
   ```

2. **company.store.ts** - Active company
   ```typescript
   const { activeCompany, setActiveCompany } = useCompanyStore();
   ```

3. **breadcrumb.store.ts** - Breadcrumb navigation
   ```typescript
   const { breadcrumbs, setBreadcrumbs } = useBreadcrumbStore();
   ```

4. **task.store.ts** - Task management
   ```typescript
   const { tasks, taskCount, addTask } = useTaskStore();
   ```

### 5. ✅ Интеграция Email Sending

**auth-service.ts теперь:**
1. Создает пользователя в PouchDB
2. Вызывает API endpoint для отправки email
3. Fallback на console.log если API недоступен

**Код:**
```typescript
// src/modules/auth/auth-service.ts
await usersDB.put(user);

// Send email via API
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
const response = await fetch(`${apiUrl}/api/auth/send-verification`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: user.email, code: verificationCode }),
});
```

### 6. ✅ Обратная совместимость

Старый код продолжает работать! Context файлы теперь обертки над Zustand:

```typescript
// Старый код - работает
import { useAuth } from "@/lib/auth-context";
const { user } = useAuth();

// Новый код - рекомендуется
import { useAuthStore } from "@/modules/shared/stores";
const { user } = useAuthStore();
```

## Разделение ответственности

### PouchDB/CouchDB - Persistent Data
- ✅ User documents
- ✅ Session documents
- ✅ Reference data (countries, industries)
- ✅ Offline-first data

**Файлы:** `src/modules/shared/database/`

### Zustand - UI State
- ✅ Current authenticated user (UI representation)
- ✅ Active company selection
- ✅ Breadcrumb state
- ✅ Task list (UI only)

**Файлы:** `src/modules/shared/stores/`

### Hono API - Backend Operations
- ✅ Email sending
- ✅ External API calls
- ✅ Future: file uploads, webhooks, etc.

**Файлы:** `src/api/`

## Migration Guide

### Для существующего кода

**Option 1:** Ничего не менять (работает через legacy wrappers)

**Option 2:** Постепенная миграция на Zustand
```typescript
// Replace
import { useAuth } from "@/lib/auth-context";

// With
import { useAuthStore } from "@/modules/shared/stores";
```

### Для нового кода

Используйте Zustand stores напрямую:

```typescript
import {
  useAuthStore,
  useCompanyStore,
  useBreadcrumbStore,
  useTaskStore,
} from "@/modules/shared/stores";

function MyComponent() {
  const { user, isAuthenticated } = useAuthStore();
  const { activeCompany } = useCompanyStore();

  // ...
}
```

## Environment Variables

Добавлены новые переменные:

```bash
# .env
API_PORT=3001
VITE_API_URL=http://localhost:3001
```

Полный список см. в `.env.example`

## Testing

### Test API
```bash
# Start API
bun run dev:api

# Test health
curl http://localhost:3001/health

# Test email sending
curl -X POST http://localhost:3001/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

### Test Signup Flow
1. Navigate to `/auth/signup`
2. Fill form and submit
3. Check email inbox for verification code
4. (Fallback) Check browser console if SMTP not configured

## Breaking Changes

### ❌ Нет breaking changes!

Все существующие импорты работают через legacy wrappers.

### ⚠️ Deprecation Warnings

В будущем планируется удалить:
- `src/lib/auth-context.tsx` (use `useAuthStore`)
- `src/lib/company-context.tsx` (use `useCompanyStore`)
- `src/lib/breadcrumb-context.tsx` (use `useBreadcrumbStore`)
- `src/lib/task-context.tsx` (use `useTaskStore`)

## Next Steps

1. ✅ Test signup flow with real email
2. ✅ Migrate components to use Zustand directly
3. 🔄 Add more API endpoints (file upload, etc.)
4. 🔄 Add error boundaries
5. 🔄 Add loading states
6. 🔄 Add retry logic for API calls

## Documentation

- **Architecture:** `docs/ARCHITECTURE.md` - Complete architecture guide
- **CouchDB Setup:** `docs/COUCHDB_SETUP.md` - Database setup
- **Main README:** `README.md` - Quick start

## Performance Improvements

1. **Zustand** - Меньше ре-рендеров благодаря selectors
2. **PouchDB indexes** - Быстрые запросы через indexes
3. **API separation** - Backend операции не блокируют UI
4. **Lazy loading** - Modules загружаются по требованию

## Questions?

См. полную документацию в `docs/ARCHITECTURE.md`

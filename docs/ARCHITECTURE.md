# Архитектура проекта Ankey

## Обзор

Ankey использует модульную архитектуру с четким разделением ответственности:

- **PouchDB/CouchDB** - для персистентных данных (users, sessions, reference data)
- **Zustand** - для UI состояния (auth, company, breadcrumbs, tasks)
- **Hono** - для backend API (email отправка, будущие endpoints)

## Структура модулей

```
src/
├── api/                                 # Backend API (Hono)
│   ├── api.hono.ts                     # API routes
│   ├── server.ts                       # Server entry point
│   └── mail.settings.ts                # Email configuration
│
├── modules/
│   ├── auth/                           # Модуль аутентификации
│   │   ├── auth.valibot.ts            # Validation schemas
│   │   ├── auth-service.ts            # Business logic
│   │   ├── signin.page.tsx
│   │   ├── signup.page.tsx
│   │   ├── verifyAccount.page.tsx
│   │   └── forgotPassword.page.tsx
│   │
│   ├── company/                        # Модуль компаний
│   │   └── companyDashboard.page.tsx
│   │
│   └── shared/                         # Общие модули
│       ├── database/                   # PouchDB слой
│       │   ├── db.ts                  # Users, Sessions DB
│       │   ├── reference-data.ts      # Countries, Industries
│       │   └── index.ts
│       │
│       └── stores/                     # Zustand stores
│           ├── auth.store.ts          # Auth UI state
│           ├── company.store.ts       # Company UI state
│           ├── breadcrumb.store.ts    # Breadcrumb UI state
│           ├── task.store.ts          # Task UI state
│           └── index.ts
│
├── lib/                                # Legacy & UI components
│   ├── auth-context.tsx               # Legacy wrapper (uses Zustand)
│   ├── company-context.tsx            # Legacy wrapper
│   ├── breadcrumb-context.tsx         # Legacy wrapper
│   ├── task-context.tsx               # Legacy wrapper
│   └── ui/                            # Shadcn components
│
└── routes/                             # Page layouts
    ├── public.layout.tsx
    ├── private.layout.tsx
    └── *.page.tsx
```

## Разделение ответственности

### PouchDB/CouchDB (Persistent Data)

**Используется для:**
- User documents (email, password hash, profile)
- Session documents (token, expiration)
- Reference data (countries, industries)
- Любые данные, которые нужно синхронизировать между устройствами

**Файлы:**
- `src/modules/shared/database/db.ts`
- `src/modules/shared/database/reference-data.ts`

**Пример:**
```typescript
import { usersDB, sessionsDB } from "@/modules/shared/database";

// Create user
await usersDB.put({
  _id: `user_${Date.now()}`,
  type: "user",
  email: "user@example.com",
  // ...
});

// Query users
const result = await usersDB.find({
  selector: { email: "user@example.com", type: "user" }
});
```

### Zustand (UI State)

**Используется для:**
- Current authenticated user (UI state)
- Active company selection
- Breadcrumb navigation
- Task list (UI only)
- Любое временное UI состояние

**Файлы:**
- `src/modules/shared/stores/auth.store.ts`
- `src/modules/shared/stores/company.store.ts`
- `src/modules/shared/stores/breadcrumb.store.ts`
- `src/modules/shared/stores/task.store.ts`

**Пример:**
```typescript
import { useAuthStore } from "@/modules/shared/stores";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  // Use state directly
  if (!isAuthenticated) return <LoginForm />;

  return <div>Welcome, {user?.fullname}</div>;
}
```

### Hono API (Backend)

**Используется для:**
- Email отправка (verification, password reset)
- Будущие серверные операции
- Интеграции с внешними сервисами

**Файлы:**
- `src/api/api.hono.ts` - Routes
- `src/api/server.ts` - Server entry
- `src/api/mail.settings.ts` - Email templates

**Endpoints:**
```
POST /api/auth/send-verification
  Body: { email: string, code: string }

POST /api/auth/send-password-reset
  Body: { email: string, resetToken: string }
```

## Поток данных

### 1. Sign Up Flow

```
User fills form
  ↓
signup.page.tsx
  ↓
AuthService.signUp()
  ↓
┌─────────────────────────────────┐
│ 1. Save to PouchDB (usersDB)   │ ← Persistent
│ 2. Call API to send email      │ ← Backend
└─────────────────────────────────┘
  ↓
API sends verification email
  ↓
User receives email with code
```

### 2. Sign In Flow

```
User enters credentials
  ↓
signin.page.tsx
  ↓
AuthService.signIn()
  ↓
┌─────────────────────────────────┐
│ 1. Verify from PouchDB         │ ← Persistent
│ 2. Create session in PouchDB   │ ← Persistent
└─────────────────────────────────┘
  ↓
useAuthStore.login()
  ↓
┌─────────────────────────────────┐
│ Set user/session in Zustand    │ ← UI State
│ Save token to localStorage     │ ← Browser
└─────────────────────────────────┘
  ↓
User sees dashboard
```

### 3. Session Restore Flow

```
Page reload
  ↓
AuthProvider mount
  ↓
useAuthStore.initialize()
  ↓
┌─────────────────────────────────┐
│ 1. Check localStorage for token│ ← Browser
│ 2. Verify with PouchDB         │ ← Persistent
└─────────────────────────────────┘
  ↓
useAuthStore.login()
  ↓
UI shows authenticated state
```

## Миграция от Context API к Zustand

Старые context файлы (`auth-context.tsx`, `company-context.tsx`, etc.) теперь являются обертками над Zustand stores для обратной совместимости.

**Старый код (работает):**
```typescript
import { useAuth } from "@/lib/auth-context";

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  // ...
}
```

**Новый код (рекомендуется):**
```typescript
import { useAuthStore } from "@/modules/shared/stores";

function MyComponent() {
  const { user, isAuthenticated } = useAuthStore();
  // ...
}
```

## Development

### Запуск приложения

```bash
# Запускает API (port 3001) и Vite (port 5173)
bun run dev

# Только frontend
bun run dev:vite

# Только API
bun run dev:api
```

### Environment Variables

```bash
# API
API_PORT=3001
VITE_API_URL=http://localhost:3001

# SMTP (email sending)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=notify@ysollo.com
SMTP_PASS=your_password
FROM_EMAIL=notify@ysollo.com
FROM_NAME=YSollo

# CouchDB
VITE_COUCHDB_URL=http://admin:password@127.0.0.1:5984

# App
APP_URL=http://localhost:5173
```

## Best Practices

### 1. Где использовать PouchDB

✅ **DO:**
- User credentials и profile
- Session tokens
- Reference data (countries, industries)
- Любые данные для offline-first

❌ **DON'T:**
- UI state (sidebar open/closed)
- Form state (current input values)
- Temporary selections

### 2. Где использовать Zustand

✅ **DO:**
- Current user UI representation
- Active company selection
- Breadcrumb state
- Modal open/closed states
- Any ephemeral UI state

❌ **DON'T:**
- Password hashes
- Session tokens (use PouchDB)
- Data that needs offline sync

### 3. Где использовать Hono API

✅ **DO:**
- Email sending
- External API calls
- Server-side validation
- File uploads (future)

❌ **DON'T:**
- Data queries (use PouchDB directly)
- Simple CRUD operations
- Client-side logic

## Добавление нового модуля

1. **Создать структуру:**
```bash
mkdir -p src/modules/my-module/{services,pages,components}
```

2. **Определить данные:**
- Persistent? → PouchDB (`src/modules/shared/database/my-data.ts`)
- UI state? → Zustand (`src/modules/shared/stores/my.store.ts`)
- Backend? → Hono (`src/api/api.hono.ts`)

3. **Создать страницы:**
```
src/modules/my-module/
  ├── my-module.valibot.ts    # Validation
  ├── my-service.ts            # Business logic
  └── my-page.tsx              # UI components
```

4. **Добавить routes:**
```typescript
// src/App.tsx
import MyPage from "@/modules/my-module/my-page";

// Add to routes array
const publicRoutes = [..., "/my-route"];

// Add to Switch
<Route path="/my-route" component={MyPage} />
```

## Troubleshooting

### PouchDB не инициализируется

```typescript
// Check console for errors
import { usersDB } from "@/modules/shared/database";
usersDB.info().then(console.log).catch(console.error);
```

### Zustand state не обновляется

```typescript
// Use selectors for better performance
const user = useAuthStore((state) => state.user);

// Not recommended (causes re-renders)
const store = useAuthStore();
```

### API не отвечает

```bash
# Check if API is running
curl http://localhost:3001/health

# Check logs
bun run dev:api
```

## Performance Tips

1. **PouchDB:** Используйте индексы для быстрых запросов
2. **Zustand:** Используйте selectors вместо полного store
3. **API:** Добавьте retry logic для email отправки
4. **Sync:** Настройте batch size для больших данных

## Security

1. **PouchDB:** Никогда не храните plain text passwords
2. **Zustand:** Не храните sensitive data в UI state
3. **API:** Всегда валидируйте input на сервере
4. **CORS:** Настройте правильные origins для production

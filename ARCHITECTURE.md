# Архитектурные Принципы Ankey

## 🎯 Обязательные к Исполнению Правила

Этот документ определяет **строгую архитектуру приложения**, которой необходимо **обязательно следовать** при любых изменениях кода.

---

## 1. Postgres-Центричная Архитектура

### Принцип
**PostgreSQL является Application Server** - вся бизнес-логика находится в SQL функциях.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Вся бизнес-логика в PostgreSQL функциях** (SECURITY DEFINER)
2. **Каждый модуль имеет свой SQL файл** с функциями
3. **Функции возвращают JSONB** для единообразия API
4. **Используем транзакции** для целостности данных
5. **RLS (Row Level Security)** для изоляции данных по компаниям

#### ❌ ЗАПРЕЩЕНО:
1. Писать бизнес-логику в TypeScript сервисах
2. Прямые SQL запросы из TypeScript (только через функции)
3. Обход транзакционных границ
4. Игнорирование multi-tenancy изоляции

### Структура SQL Функций

```sql
-- Пример: src/modules/auth/auth.sql

-- 1. Создание схемы (если нужно)
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Функция с бизнес-логикой
CREATE OR REPLACE FUNCTION auth.signup(
  _email TEXT,
  _password TEXT,
  _fullname TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_verification_code TEXT;
BEGIN
  -- Валидация
  IF _email IS NULL OR _password IS NULL THEN
    RAISE EXCEPTION 'Email and password required';
  END IF;

  -- Бизнес-логика
  v_user_id := gen_random_uuid();
  v_verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Вставка данных
  INSERT INTO users (id, email, password, fullname, verification_code, verified)
  VALUES (v_user_id, _email, encode(digest(_password, 'sha256'), 'hex'), _fullname, v_verification_code, false);

  -- Возврат результата
  RETURN jsonb_build_object(
    'userId', v_user_id,
    'email', _email,
    'verificationCode', v_verification_code
  );
END;
$$;
```

---

## 2. Hono как Thin API Gateway

### Принцип
**Hono - это только транспортный слой** (REST gateway) без бизнес-логики.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Универсальный роутер**: `POST /api/:functionName` → вызывает PostgreSQL функцию
2. **Минимальная логика**: только парсинг параметров и вызов функции
3. **Обработка ошибок**: перехват исключений PostgreSQL и возврат клиенту
4. **Единая точка входа**: все функции доступны через один эндпоинт

#### ❌ ЗАПРЕЩЕНО:
1. Бизнес-логика в Hono routes
2. Валидация данных в Hono (только в PostgreSQL)
3. Прямые операции с БД (INSERT/UPDATE/DELETE)
4. Хранение состояния в Hono

### Структура Hono Routes

```typescript
// src/api/routes/auth.routes.ts

import { Hono } from "hono";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = new Hono();

// Универсальный роутер
app.post("/:fn", async (c) => {
  const functionName = c.req.param("fn");
  const body = await c.req.json();
  const params = Object.values(body);

  // Формирование плейсхолдеров $1, $2, ...
  const placeholders = params.map((_, i) => `$${i + 1}`).join(", ");

  try {
    // Вызов PostgreSQL функции
    const query = `SELECT ${functionName}(${placeholders}) AS result`;
    const result = await pool.query(query, params);

    return c.json(result.rows[0]?.result || {});
  } catch (error: any) {
    console.error(`[${functionName}] Error:`, error.message);
    return c.json({ error: error.message }, 400);
  }
});

export default app;
```

---

## 3. Thin Client Services (React/TypeScript)

### Принцип
**Frontend сервисы - это тонкие обертки** над API вызовами, без бизнес-логики.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Только API вызовы**: сервис вызывает Hono API
2. **Типизация**: используем TypeScript интерфейсы
3. **Обработка ошибок**: try/catch с понятными сообщениями
4. **Единообразие**: все методы async/await

#### ❌ ЗАПРЕЩЕНО:
1. Бизнес-логика в сервисах (валидация, вычисления)
2. Прямые обращения к БД из клиента
3. Состояние в сервисах (используй Zustand/Context)
4. Обход API (прямые PostgreSQL вызовы)

### Структура Client Service

```typescript
// src/modules/auth/auth-service.ts

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Функция вызова PostgreSQL через Hono
async function callFunction(fnName: string, params: any = {}) {
  const response = await fetch(`${API_URL}/api/${fnName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export class AuthService {
  // Тонкая обертка над PostgreSQL функцией
  static async signUp(email: string, password: string, fullname: string) {
    return callFunction("auth.signup", { email, password, fullname });
  }

  static async signIn(email: string, password: string) {
    return callFunction("auth.signin", { email, password });
  }

  static async verifyAccount(email: string, code: string) {
    return callFunction("auth.verify_account", { email, code });
  }
}
```

---

## 4. Multi-Tenancy через Partitioned Databases

### Принцип
**Изоляция данных компаний** через partition keys в PostgreSQL.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Все таблицы с company_id**: для изоляции данных
2. **RLS политики**: автоматическая фильтрация по company_id
3. **Индексы на company_id**: для производительности
4. **Проверка доступа**: в каждой функции проверять права пользователя

#### ❌ ЗАПРЕЩЕНО:
1. Данные без company_id (кроме глобальных: users, sessions)
2. Кросс-компанийные запросы без явного разрешения
3. Обход RLS политик
4. Доверие клиенту (всегда проверять на сервере)

### Пример RLS

```sql
-- Включаем RLS для таблицы
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Политика: пользователь видит только задачи своей компании
CREATE POLICY tasks_isolation ON tasks
  USING (company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = current_setting('app.user_id')::UUID
  ));
```

---

## 5. Структура Модулей

### Принцип
**Каждый модуль - автономная единица** с SQL, сервисом и UI.

### Правила

#### Структура модуля:
```
src/modules/auth/
├── auth.sql                 # PostgreSQL функции (ОБЯЗАТЕЛЬНО)
├── auth-service.ts          # Thin client service
├── auth.valibot.ts          # Схемы валидации (клиентская)
├── signin.page.tsx          # UI компоненты
├── signup.page.tsx
└── account/
    ├── account.page.tsx
    └── contact.page.tsx
```

#### ✅ ОБЯЗАТЕЛЬНО:
1. **auth.sql**: все функции модуля в одном файле
2. **auth-service.ts**: обертки над API вызовами
3. **auth.valibot.ts**: клиентская валидация форм
4. **Именование функций**: `module_name.function_name` (например: `auth.signup`)

#### ❌ ЗАПРЕЩЕНО:
1. Смешивание модулей (auth не должен импортировать company напрямую)
2. SQL запросы в сервисах (только вызовы функций)
3. Бизнес-логика в UI компонентах
4. Глобальные утилиты с бизнес-логикой

---

## 6. Управление Состоянием

### Принцип
**Zustand для UI состояния, PostgreSQL для данных**.

### Правила

#### ✅ Используй Zustand для:
1. Текущий пользователь (UI представление)
2. Активная компания
3. Breadcrumbs
4. Модальные окна, формы
5. Кеш на клиенте (временный)

#### ✅ Используй PostgreSQL для:
1. Пользователи и аутентификация
2. Компании и члены команды
3. Бизнес-данные (задачи, оргчарты, DOA)
4. Любые данные, требующие постоянства

#### ❌ ЗАПРЕЩЕНО:
1. Хранить бизнес-данные в Zustand/Context
2. Синхронизировать состояние вручную
3. Дублировать данные между Zustand и PostgreSQL

---

## 7. Типизация и Валидация

### Принцип
**Двойная валидация**: клиент (UX) + сервер (безопасность).

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Клиентская валидация** (Valibot): для UX, мгновенная обратная связь
2. **Серверная валидация** (PostgreSQL): для безопасности, финальная проверка
3. **TypeScript интерфейсы**: для всех типов данных
4. **Единая типизация**: интерфейсы в `src/modules/shared/types/database.types.ts`

#### ❌ ЗАПРЕЩЕНО:
1. Доверять клиентской валидации
2. Пропускать серверную валидацию
3. Дублировать интерфейсы в разных файлах
4. Any типы (используй unknown или конкретные типы)

### Пример

```typescript
// src/modules/auth/auth.valibot.ts (клиент)
import * as v from "valibot";

export const signUpSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  fullname: v.pipe(v.string(), v.minLength(2)),
});

export type SignUpInput = v.InferOutput<typeof signUpSchema>;
```

```sql
-- src/modules/auth/auth.sql (сервер)
CREATE OR REPLACE FUNCTION auth.signup(...)
RETURNS JSONB AS $$
BEGIN
  -- Валидация email
  IF _email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Валидация пароля
  IF LENGTH(_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  -- ...
END;
$$;
```

---

## 8. Обработка Ошибок

### Принцип
**Централизованная обработка ошибок** на каждом уровне.

### Правила

#### PostgreSQL уровень:
```sql
BEGIN
  -- Код
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User already exists';
  WHEN OTHERS THEN
    RAISE;
END;
```

#### Hono уровень:
```typescript
try {
  const result = await pool.query(query, params);
  return c.json(result.rows[0]?.result);
} catch (error: any) {
  console.error(`[${functionName}] Error:`, error.message);
  return c.json({ error: error.message }, 400);
}
```

#### Client уровень:
```typescript
try {
  const result = await AuthService.signUp(data);
  toast.success("Account created!");
  navigate("/auth/verify-account");
} catch (error) {
  toast.error(error instanceof Error ? error.message : "An error occurred");
}
```

---

## 9. Миграции и SQL Файлы

### Принцип
**Централизованные SQL файлы** в `src/api/db/` с разделением схемы и функций.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Два файла на модуль**:
   - `moduleName.definition.sql` - схема (таблицы, индексы, триггеры)
   - `moduleName.functions.sql` - бизнес-логика (функции)
2. **Idempotent**: `CREATE OR REPLACE FUNCTION`, `CREATE TABLE IF NOT EXISTS`
3. **Миграции в отдельных файлах**: `migrations/YYYY-MM-DD_description.sql`
4. **Комментарии**: описание каждой функции и таблицы
5. **Audit logging**: все изменения логируются в `audit.log`

#### ❌ ЗАПРЕЩЕНО:
1. SQL файлы в `src/modules/` (только в `src/api/db/`)
2. DROP без IF EXISTS
3. Изменение существующих функций без миграций
4. SQL код в TypeScript
5. created_at/updated_at в каждой таблице без audit логирования

### Структура:
```
src/api/db/
├── 00-init-all.sql              # Мастер-скрипт инициализации
├── README.md                    # Документация
│
├── audit.definition.sql         # Audit система (таблицы)
├── audit.functions.sql          # Audit функции
├── audit.triggers.sql           # Автоматические триггеры
│
├── auth.definition.sql          # Auth схема
├── auth.functions.sql           # Auth функции
│
├── company.definition.sql       # Company схема
├── company.functions.sql        # Company функции
│
├── inquiry.definition.sql       # Inquiry схема
├── inquiry.functions.sql        # Inquiry функции
│
├── orgchart.definition.sql      # OrgChart схема
└── orgchart.functions.sql       # OrgChart функции
```

---

## 10. Audit Logging и SOC/SoX Compliance

### Принцип
**Централизованное логирование всех действий** для SOC reports и SoX compliance.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Все CRUD операции логируются** в `audit.log`
2. **Soft Delete Pattern**: используй `audit.soft_delete()` вместо физического удаления
3. **Session Tracking**: все сессии в `audit.sessions`
4. **Audit Trail**: возможность получить историю изменений любой записи
5. **Retention Policy**: логи хранятся минимум 7 лет (SOX требование)

#### ❌ ЗАПРЕЩЕНО:
1. Физическое удаление без soft delete
2. Изменения без логирования
3. Обход audit системы
4. Удаление audit логов

### Структура Audit Логов

```sql
-- Пример автоматического логирования
CREATE TRIGGER audit_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_log();

-- Пример ручного логирования
PERFORM audit.log_action(
  _user_id => 'user_1234567890_uuid',
  _action => 'APPROVE',
  _table_name => 'orgcharts',
  _record_id => _orgchart_id,
  _company_id => _company_id,
  _old_values => row_to_json(OLD)::JSONB,
  _new_values => row_to_json(NEW)::JSONB
);
```

### Soft Delete Pattern

**Вместо физического удаления:**

```sql
-- ПЛОХО
DELETE FROM companies WHERE id = _company_id;
```

```sql
-- ХОРОШО
-- 1. Создать soft delete запись
PERFORM audit.soft_delete(
  'companies',
  v_company._id,
  _user_id,
  row_to_json(v_company)::JSONB,
  _company_id,
  90  -- Permanent delete after 90 days
);

-- 2. Физически удалить (или пометить как deleted)
DELETE FROM companies WHERE id = _company_id;

-- 3. Восстановление при необходимости
SELECT audit.restore_soft_deleted('companies', 'company_id_here', 'user_id');
```

### SOC/SoX Reports

```sql
-- Генерация SOC отчета
SELECT audit.generate_soc_report(
  'SOC2',
  '2025-01-01'::TIMESTAMP,
  '2025-12-31'::TIMESTAMP,
  'admin@example.com'
);

-- Активность пользователя
SELECT audit.get_user_activity(
  'user_id',
  NOW() - INTERVAL '30 days',
  NOW()
);

-- Аудит-трейл записи
SELECT audit.get_audit_trail('companies', 'company_id');
```

### Session Tracking

```sql
-- Начало сессии (в auth.signin)
PERFORM audit.track_session_start(
  _user_id,
  _email,
  _session_token,
  _ip_address::INET,
  _user_agent,
  'password'
);

-- Обновление активности
PERFORM audit.update_session_activity(_session_token);

-- Завершение сессии (в auth.signout)
PERFORM audit.track_session_end(_session_token, 'manual');
```

---

## 11. Производительность

### Принцип
**Оптимизация на уровне PostgreSQL**, кеширование на клиенте.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Индексы**: на все часто запрашиваемые поля
2. **EXPLAIN ANALYZE**: перед деплоем сложных запросов
3. **Connection pooling**: использовать pg.Pool
4. **Кеширование reference data**: in-memory cache для стран/индустрий
5. **Pagination**: всегда ограничивать количество записей

#### ❌ ЗАПРЕЩЕНО:
1. N+1 запросы (используй JOIN или batch)
2. SELECT * (выбирай только нужные поля)
3. Отсутствие LIMIT в списках
4. Игнорирование индексов

---

## 12. Безопасность

### Принцип
**Безопасность на каждом уровне**, never trust the client.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **SECURITY DEFINER**: для всех функций
2. **Password hashing**: используй pgcrypto
3. **Session validation**: проверка токенов
4. **RLS**: для multi-tenancy
5. **Input sanitization**: в PostgreSQL функциях

#### ❌ ЗАПРЕЩЕНО:
1. Пароли в открытом виде
2. SQL injection (всегда используй параметры)
3. Доверие клиентским данным
4. Хранение секретов в коде (используй .env)

---

## 13. Тестирование

### Принцип
**Тестируй PostgreSQL функции напрямую**, клиент проверяй интеграционно.

### Правила

#### ✅ ОБЯЗАТЕЛЬНО:
1. **Unit тесты для SQL функций**: прямые вызовы через psql
2. **Integration тесты**: через Hono API
3. **E2E тесты**: критические флоу (signup → signin → создание компании)
4. **Типизация**: проверка TypeScript типов

---

## 📋 Чеклист для Новой Фичи

Перед добавлением новой функциональности проверь:

- [ ] **SQL функции созданы** в соответствующем модуле (например, `auth.sql`)
- [ ] **Функции возвращают JSONB**
- [ ] **SECURITY DEFINER** установлен
- [ ] **Валидация данных** в PostgreSQL функции
- [ ] **RLS политики** для multi-tenancy (если нужно)
- [ ] **Hono route** добавлен или используется универсальный роутер
- [ ] **Client service** создан как thin wrapper
- [ ] **TypeScript интерфейсы** определены
- [ ] **Valibot схемы** для клиентской валидации
- [ ] **Обработка ошибок** на всех уровнях
- [ ] **Индексы** добавлены для производительности
- [ ] **Тесты** написаны для SQL функций
- [ ] **Документация** обновлена

---

## 🚫 Антипаттерны (Что НЕ делать)

### ❌ 1. Бизнес-логика в TypeScript
```typescript
// ПЛОХО
static async signUp(data: SignUpInput) {
  // Валидация email
  if (!data.email.includes('@')) {
    throw new Error('Invalid email');
  }

  // Хеширование пароля
  const hashedPassword = await hashPassword(data.password);

  // Вставка в БД
  await db.query('INSERT INTO users ...');
}
```

```sql
-- ХОРОШО
CREATE OR REPLACE FUNCTION auth.signup(_email TEXT, _password TEXT)
RETURNS JSONB AS $$
BEGIN
  -- Вся логика здесь
  ...
END;
$$;
```

### ❌ 2. Прямые SQL запросы из клиента
```typescript
// ПЛОХО
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
```

```typescript
// ХОРОШО
const result = await callFunction('auth.get_user_by_email', { email });
```

### ❌ 3. Дублирование данных в Zustand
```typescript
// ПЛОХО
const useUserStore = create((set) => ({
  users: [],
  companies: [],
  tasks: [],
  loadUsers: async () => { /* fetch и set */ }
}));
```

```typescript
// ХОРОШО - данные живут в PostgreSQL
const useUIStore = create((set) => ({
  activeCompanyId: null,
  breadcrumbs: [],
  isModalOpen: false,
}));
```

---

## 📖 Справочные Документы

1. [docs/approach.txt](docs/approach.txt) - Основной архитектурный подход
2. [docs/shadcn.llm.txt](docs/shadcn.llm.txt) - Руководство по shadcn/ui компонентам

---

## 🎓 Заключение

**Эта архитектура является обязательной** для всех изменений в кодовой базе Ankey.

При любых сомнениях:
1. Проверь этот документ
2. Посмотри примеры в уже мигрированных модулях (auth, company, inquiry, orgchart)
3. Следуй принципу: **PostgreSQL = бизнес-логика, Hono = транспорт, Client = UI**

**Не допускается** отклонение от этой архитектуры без явного обоснования и согласования.

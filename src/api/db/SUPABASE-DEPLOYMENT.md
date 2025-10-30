# Деплой в Supabase Production

Это руководство описывает как развернуть вашу базу данных с множественными схемами в Supabase.

## ✅ Поддержка архитектуры

Ваша архитектура **ПОЛНОСТЬЮ СОВМЕСТИМА** с Supabase:
- ✅ Множественные schemas (audit, auth, company, orgchart, doa, inquiry, task, reference, users)
- ✅ PostgreSQL функции в custom schemas
- ✅ JSONB оптимизация
- ✅ Row Level Security (RLS)
- ✅ Audit logging через триггеры

## 📋 Шаги деплоя

### 1. Создайте проект в Supabase

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запомните Database Password (понадобится для локального подключения)
4. Дождитесь полной инициализации проекта (~2 минуты)

### 2. Получите connection string

В Dashboard → Settings → Database найдите:
- **Connection string** (URI format)
- **Connection pooling** (для production рекомендуется использовать)

Пример:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 3. Выполните миграции

#### Вариант А: Через Supabase SQL Editor (рекомендуется)

1. Откройте Dashboard → SQL Editor
2. Создайте новый query
3. Вставьте содержимое каждого файла миграции **в правильном порядке**:

```sql
-- Порядок выполнения (ВАЖНО!):

-- 1. Audit system
-- src/api/db/audit.definition.sql
-- src/api/db/audit.functions.sql

-- 2. Core schemas
-- src/api/db/auth.definition.sql
-- src/api/db/company.definition.sql

-- 3. Core functions
-- src/api/db/auth.functions.sql
-- src/api/db/company.functions.sql

-- 4. Business modules
-- src/api/db/inquiry.definition.sql
-- src/api/db/inquiry.functions.sql
-- src/api/db/orgchart.definition.sql
-- src/api/db/orgchart.functions.sql
-- src/api/db/doa.definition.sql
-- src/api/db/doa.functions.sql
-- src/api/db/task.definition.sql
-- src/api/db/task.functions.sql

-- 5. Reference data
-- src/api/db/reference.definition.sql
-- src/api/db/reference.functions.sql
-- src/api/db/users.functions.sql

-- 6. Triggers (ПОСЛЕДНИМИ!)
-- src/api/db/audit.triggers.sql
```

4. Выполните каждый файл по очереди, проверяя успешность выполнения

#### Вариант Б: Из локальной машины через psql

```bash
# Замените на ваш connection string
export SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Выполните все миграции
cd src/api/db

psql $SUPABASE_DB_URL -f audit.definition.sql
psql $SUPABASE_DB_URL -f audit.functions.sql
psql $SUPABASE_DB_URL -f auth.definition.sql
psql $SUPABASE_DB_URL -f company.definition.sql
psql $SUPABASE_DB_URL -f auth.functions.sql
psql $SUPABASE_DB_URL -f company.functions.sql
psql $SUPABASE_DB_URL -f inquiry.definition.sql
psql $SUPABASE_DB_URL -f inquiry.functions.sql
psql $SUPABASE_DB_URL -f orgchart.definition.sql
psql $SUPABASE_DB_URL -f orgchart.functions.sql
psql $SUPABASE_DB_URL -f doa.definition.sql
psql $SUPABASE_DB_URL -f doa.functions.sql
psql $SUPABASE_DB_URL -f task.definition.sql
psql $SUPABASE_DB_URL -f task.functions.sql
psql $SUPABASE_DB_URL -f reference.definition.sql
psql $SUPABASE_DB_URL -f reference.functions.sql
psql $SUPABASE_DB_URL -f users.functions.sql
psql $SUPABASE_DB_URL -f audit.triggers.sql
```

### 4. Настройте права доступа

**КРИТИЧЕСКИ ВАЖНО!** Supabase требует специальные права для работы с custom schemas.

1. Откройте SQL Editor
2. Выполните файл `supabase-permissions.sql`:

```bash
# Через psql
psql $SUPABASE_DB_URL -f supabase-permissions.sql
```

Или скопируйте весь файл в SQL Editor и выполните.

### 5. Expose schemas в API Settings

1. Откройте Dashboard → Settings → API
2. Найдите секцию **"Exposed schemas"**
3. Добавьте все ваши schemas через запятую:

```
audit,auth,company,orgchart,doa,inquiry,task,reference,users
```

4. Нажмите Save

### 6. Обновите .env для production

Создайте `.env.production`:

```bash
# Supabase Configuration
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (для прямого подключения из API сервера)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# SMTP (если нужно)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=notify@ysollo.com
SMTP_PASS=your-password-here
FROM_EMAIL=notify@ysollo.com
FROM_NAME=YSollo

# Application
APP_URL=https://your-domain.com
API_PORT=3001
```

Где найти ключи:
- Dashboard → Settings → API → Project API keys

## 🔧 Обновление клиентского кода

### Вызов функций в custom schemas

Ваш текущий код уже правильный, но для Supabase нужно добавить параметр `schema`:

```typescript
// Было (работает с вашим API сервером):
const result = await callFunction('orgchart.create_orgchart', {
  _company_id: companyId,
  _user_id: userId,
  _title: title,
});

// Для прямого вызова через Supabase (опционально):
const { data, error } = await supabase.rpc(
  'create_orgchart',
  {
    _company_id: companyId,
    _user_id: userId,
    _title: title,
  },
  {
    schema: 'orgchart'  // Указываем схему!
  }
);
```

### Если используете Hono API (ваш текущий подход)

Ваш API сервер остается без изменений! Просто обновите `DATABASE_URL` в `.env`:

```typescript
// src/api/routes/auth.routes.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL // Теперь указывает на Supabase
});

// Вызовы остаются те же:
const result = await pool.query(
  'SELECT orgchart.create_orgchart($1, $2, $3, $4) AS result',
  [companyId, userId, title, description]
);
```

## 🧪 Тестирование

### 1. Проверьте схемы

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('audit', 'auth', 'company', 'orgchart', 'doa', 'inquiry', 'task', 'reference', 'users')
ORDER BY schema_name;
```

Должны увидеть все 9 схем.

### 2. Проверьте функции

```sql
SELECT routine_schema, routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema IN ('orgchart', 'auth', 'company')
ORDER BY routine_schema, routine_name;
```

### 3. Проверьте таблицы

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('public', 'audit')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
```

### 4. Тестовый вызов функции

```sql
-- Создайте тестового пользователя
INSERT INTO users (email, password, fullname, verified, type)
VALUES (
  'test@example.com',
  'a0878028cd43a3a00b15834ce4a18e363d803b5be86b8a8a1aa91f6f1c039138',
  'Test User',
  true,
  'user'
)
RETURNING id, email;

-- Создайте тестовую компанию и проверьте что все работает
```

## ⚠️ Важные заметки

### Row Level Security (RLS)

Supabase **требует включения RLS** для защиты данных. Однако, поскольку вы используете свой API сервер (Hono), и обращаетесь к БД через `service_role`, RLS можно не включать.

Если хотите включить RLS для дополнительной защиты:

```sql
-- Включите RLS для критичных таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgcharts ENABLE ROW LEVEL SECURITY;

-- Создайте политики (пример)
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### Audit логирование

Ваши audit триггеры будут работать автоматически, логируя все изменения в `audit_log` таблицу.

### Connection Pooling

В production обязательно используйте **Supabase Pooler** (порт 6543), а не прямое подключение (порт 5432):

```
✅ ПРАВИЛЬНО: postgres.[PROJECT-REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres
❌ НЕПРАВИЛЬНО: postgres.[PROJECT-REF]:[PASSWORD]@...aws-0-[REGION].supabase.com:5432/postgres
```

Pooler защищает от исчерпания соединений.

## 📊 Мониторинг

В Supabase Dashboard → Database → Usage вы можете отслеживать:
- Количество запросов
- Размер базы данных
- Количество активных соединений
- Медленные запросы

## 🔄 Миграции в будущем

Для применения новых миграций:

1. Создайте файл `migrations/YYYY-MM-DD_description.sql`
2. Выполните через SQL Editor или psql
3. Если добавляете новые схемы - не забудьте:
   - Выполнить `supabase-permissions.sql` для новой схемы
   - Добавить схему в "Exposed schemas" в API Settings

## 🚀 Готово!

Ваша база данных с множественными схемами теперь работает в Supabase Production!

Архитектура PostgreSQL-first полностью поддерживается, и ваш код не требует изменений.

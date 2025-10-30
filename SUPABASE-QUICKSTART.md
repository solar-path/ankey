# Supabase Quick Start - 5 минут

Быстрое руководство по деплою вашей базы данных в Supabase.

## ✅ Ваша архитектура полностью поддерживается!

- ✅ Множественные schemas (audit, auth, company, orgchart, doa, inquiry, task, reference, users)
- ✅ PostgreSQL функции в custom schemas
- ✅ JSONB оптимизация (orgchart модуль)
- ✅ Row Level Security и Audit logging

## 🚀 Быстрый деплой (5 шагов)

### 1. Создайте проект в Supabase

1. Зайдите на [supabase.com](https://supabase.com) и создайте проект
2. Скопируйте **Database Password** из начального экрана
3. Дождитесь инициализации (~2 минуты)

### 2. Получите connection string

Dashboard → Settings → Database → Connection string (URI)

Должно выглядеть так:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

⚠️ **Важно:** Используйте **pooler** (порт 6543), а не прямое подключение!

### 3. Запустите миграции

```bash
# Экспортируйте connection string
export SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres"

# Автоматический деплой всех миграций
bun run db:deploy:supabase
```

Скрипт выполнит все 18 SQL файлов в правильном порядке.

### 4. Настройте права доступа

```bash
# Используйте тот же SUPABASE_DB_URL
bun run db:supabase:permissions
```

Скрипт выдаст инструкции для следующего шага.

### 5. Expose schemas в Dashboard

1. Откройте Dashboard → Settings → API
2. Найдите **"Exposed schemas"**
3. Добавьте:
   ```
   audit,auth,company,orgchart,doa,inquiry,task,reference,users
   ```
4. Нажмите **Save**

## ✅ Готово!

Теперь все ваши PostgreSQL функции доступны через Supabase API.

## 📝 Обновите .env для production

```bash
# Production .env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres

# Остальные настройки остаются без изменений
```

## 🧪 Тестирование

### Проверка через SQL Editor

```sql
-- Проверить что все схемы созданы
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN ('audit', 'auth', 'company', 'orgchart', 'doa', 'inquiry', 'task', 'reference', 'users')
ORDER BY schema_name;

-- Проверить функции orgchart
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'orgchart'
ORDER BY routine_name;
```

### Тестовый вызов функции

```sql
-- Создать тестового пользователя
INSERT INTO users (email, password, fullname, verified, type)
VALUES (
  'test@example.com',
  'a0878028cd43a3a00b15834ce4a18e363d803b5be86b8a8a1aa91f6f1c039138',
  'Test User',
  true,
  'user'
)
RETURNING id, _id, email;
```

## 💡 Вызов функций из клиента

### Вариант 1: Через ваш API (рекомендуется)

Ваш существующий код **не требует изменений**! Просто обновите `DATABASE_URL`:

```typescript
// src/api/routes/auth.routes.ts - БЕЗ ИЗМЕНЕНИЙ
const pool = new Pool({
  connectionString: process.env.DATABASE_URL // Теперь указывает на Supabase
});
```

### Вариант 2: Прямые вызовы через Supabase SDK (опционально)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://[PROJECT-REF].supabase.co',
  'your-anon-key'
);

// Вызов функции в custom schema
const { data, error } = await supabase.rpc(
  'create_orgchart',
  {
    _company_id: companyId,
    _user_id: userId,
    _title: 'New Org Chart',
  },
  {
    schema: 'orgchart'  // Указываем схему!
  }
);
```

## 📚 Полная документация

Для детальной информации смотрите:
- [SUPABASE-DEPLOYMENT.md](src/api/db/SUPABASE-DEPLOYMENT.md) - Полное руководство
- [supabase-permissions.sql](src/api/db/supabase-permissions.sql) - SQL скрипт прав доступа

## ⚙️ Доступные команды

```bash
# Локальная разработка (PostgreSQL на localhost)
bun run db:reset                    # Drop + migrate + seed

# Production деплой (Supabase)
bun run db:deploy:supabase          # Деплой миграций в Supabase
bun run db:supabase:permissions     # Настройка прав доступа
```

## 🎯 Ключевые преимущества

✅ **Zero-downtime deployments** - миграции выполняются онлайн
✅ **Automatic backups** - Supabase делает бэкапы каждый день
✅ **Connection pooling** - защита от исчерпания соединений
✅ **Real-time monitoring** - Dashboard показывает метрики в реальном времени
✅ **PostgreSQL 15+** - современная версия с полной поддержкой JSONB

## ❓ Частые вопросы

**Q: Нужно ли использовать Supabase Auth?**
A: Нет! Вы используете свою систему аутентификации через `auth` схему. Supabase Auth можно отключить.

**Q: Работают ли триггеры и audit logging?**
A: Да! Все PostgreSQL триггеры работают нормально. Ваши `audit.triggers.sql` будут логировать изменения автоматически.

**Q: Можно ли использовать Row Level Security (RLS)?**
A: Да, но не обязательно. Ваш API сервер использует `service_role`, который обходит RLS. RLS нужен только если вы делаете прямые запросы из клиента.

**Q: Что делать при добавлении новых миграций?**
A: Создайте новый SQL файл, добавьте его в `migrations` массив в `deploy-to-supabase.ts`, и запустите `bun run db:deploy:supabase`.

## 🆘 Поддержка

Если что-то не работает:
1. Проверьте что connection string использует **pooler** (порт 6543)
2. Проверьте что schemas добавлены в "Exposed schemas"
3. Проверьте логи в Dashboard → Database → Logs
4. Запустите verification queries из [SUPABASE-DEPLOYMENT.md](src/api/db/SUPABASE-DEPLOYMENT.md#-тестирование)

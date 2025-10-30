# Database Schema and Functions

Централизованная директория для всех SQL файлов приложения.

## Структура

Каждый модуль имеет два файла:
1. **`moduleName.definition.sql`** - Схема базы данных (таблицы, индексы, триггеры)
2. **`moduleName.functions.sql`** - Бизнес-логика (PostgreSQL функции)

## Модули

### Core Modules

1. **audit** - Система аудит-логирования
   - [audit.definition.sql](./audit.definition.sql) - Таблицы для SOC/SoX compliance
   - [audit.functions.sql](./audit.functions.sql) - Функции логирования
   - [audit.triggers.sql](./audit.triggers.sql) - Автоматические триггеры

2. **auth** - Аутентификация и авторизация
   - [auth.definition.sql](./auth.definition.sql) - Users, Sessions
   - [auth.functions.sql](./auth.functions.sql) - signup, signin, verify, etc.

3. **company** - Управление компаниями
   - [company.definition.sql](./company.definition.sql) - Companies, User-Companies
   - [company.functions.sql](./company.functions.sql) - CRUD операции

4. **inquiry** - Контактная форма
   - [inquiry.definition.sql](./inquiry.definition.sql) - Inquiries
   - [inquiry.functions.sql](./inquiry.functions.sql) - Обработка обращений

5. **orgchart** - Организационная структура
   - [orgchart.definition.sql](./orgchart.definition.sql) - OrgCharts, Approvals
   - [orgchart.functions.sql](./orgchart.functions.sql) - Иерархия и воркфлоу

6. **reference** - Справочные данные
   - [reference.definition.sql](./reference.definition.sql) - Countries, Industries tables
   - [reference.functions.sql](./reference.functions.sql) - PostgreSQL функции (API)
   - [reference.seed.sql](./reference.seed.sql) - SQL скрипт с данными (244 страны, 170 отраслей)
   - Популяция: `bun run db:seed:reference` - быстрая загрузка через SQL
   - 📚 [Документация по reference data](./README-REFERENCE-DATA.md)

**Примеры использования:**
```sql
-- Countries
SELECT reference.get_all_countries();                    -- Все страны
SELECT reference.get_country_by_code('US');             -- Страна по коду
SELECT reference.search_countries('kazak', 10);         -- Поиск стран

-- Industries
SELECT reference.get_all_industries();                   -- Все отрасли
SELECT reference.get_industry_by_code(45103010);        -- Отрасль по коду
SELECT reference.search_industries('software', 10);      -- Поиск отраслей
```

## Применение Миграций

### Первоначальная установка

```bash
# 1. Создать базу данных
createdb ankey

# 2. Применить audit систему (должна быть первой!)
psql -d ankey -f audit.definition.sql
psql -d ankey -f audit.functions.sql
psql -d ankey -f audit.triggers.sql

# 3. Применить остальные модули
psql -d ankey -f auth.definition.sql
psql -d ankey -f auth.functions.sql

psql -d ankey -f company.definition.sql
psql -d ankey -f company.functions.sql

psql -d ankey -f inquiry.definition.sql
psql -d ankey -f inquiry.functions.sql

psql -d ankey -f orgchart.definition.sql
psql -d ankey -f orgchart.functions.sql
```

### Или использовать мастер-скрипт

```bash
psql -d ankey -f 00-init-all.sql
```

## Архитектурные Принципы

### 1. Audit Logging

**Все изменения данных логируются** в `audit.log`:
- CREATE, UPDATE, DELETE операции
- LOGIN, LOGOUT события
- APPROVE, REJECT действия

**Soft Delete Pattern:**
- Вместо физического удаления используется `audit.soft_delete()`
- Данные сохраняются в `audit.soft_deletes` с snapshot
- Возможность восстановления через `audit.restore_soft_deleted()`

### 2. Multi-Tenancy

**Row Level Security (RLS):**
- Автоматическая изоляция данных по `company_id`
- Политики применяются через `app.current_company_id`
- Используйте `orgchart.set_company_context()` перед запросами

### 3. Timestamps

**Упрощенная схема:**
- `created_at` - только для создания записи
- `updated_at` - обновляется автоматически через trigger
- Детальная история изменений в `audit.log`

### 4. Dual-Key System

**UUID + TEXT:**
- `id` - UUID для эффективных JOIN'ов
- `_id` - TEXT для совместимости (формат: `prefix_<timestamp>_<uuid>`)

## SOC/SoX Compliance Reports

### Генерация отчетов

```sql
-- SOC отчет за период
SELECT audit.generate_soc_report(
  'SOC2',
  '2025-01-01'::TIMESTAMP,
  '2025-12-31'::TIMESTAMP,
  'admin@example.com'
);

-- Активность пользователя
SELECT audit.get_user_activity(
  'user_1234567890_uuid',
  NOW() - INTERVAL '30 days',
  NOW()
);

-- Аудит-трейл записи
SELECT audit.get_audit_trail('companies', 'company_id_here');
```

### Очистка старых данных

```sql
-- Удалить логи старше 7 лет (SOX требование)
SELECT audit.cleanup_old_logs(2555);

-- Удалить soft-deleted записи по расписанию
SELECT audit.cleanup_soft_deletes();
```

## Session Tracking

**Детальное отслеживание сессий:**

```sql
-- Начало сессии
SELECT audit.track_session_start(
  'user_1234567890_uuid',
  'user@example.com',
  'session_token_here',
  '192.168.1.1'::INET,
  'Mozilla/5.0...',
  'password'
);

-- Обновление активности
SELECT audit.update_session_activity('session_token_here');

-- Завершение сессии
SELECT audit.track_session_end('session_token_here', 'manual');
```

## Интеграция с Бизнес-Логикой

### Пример использования в функциях

```sql
CREATE OR REPLACE FUNCTION company.delete_company(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company RECORD;
BEGIN
  -- Получить данные для snapshot
  SELECT * INTO v_company FROM companies WHERE id = _company_id;

  IF v_company.id IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  -- Soft delete вместо физического удаления
  PERFORM audit.soft_delete(
    'companies',
    v_company._id,
    current_setting('app.user_id', TRUE),
    row_to_json(v_company)::JSONB,
    _company_id,
    90  -- Permanent delete after 90 days
  );

  -- Пометить как удаленную (или физически удалить)
  DELETE FROM companies WHERE id = _company_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

## Maintenance

### Scheduled Jobs (pg_cron)

```sql
-- Setup pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cleanup expired sessions (hourly)
SELECT cron.schedule(
  'cleanup-sessions',
  '0 * * * *',
  'SELECT auth.cleanup_expired_sessions()'
);

-- Cleanup old audit logs (monthly, keep 7 years)
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 0 1 * *',
  'SELECT audit.cleanup_old_logs(2555)'
);

-- Cleanup soft deletes (daily)
SELECT cron.schedule(
  'cleanup-soft-deletes',
  '0 2 * * *',
  'SELECT audit.cleanup_soft_deletes()'
);
```

## Мониторинг

### Полезные запросы

```sql
-- Статистика аудит-логов
SELECT
  action,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM audit.log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;

-- Подозрительные активности
SELECT *
FROM audit.sessions
WHERE is_suspicious = TRUE
ORDER BY login_at DESC;

-- Самые активные пользователи
SELECT
  user_id,
  user_email,
  COUNT(*) as action_count
FROM audit.log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, user_email
ORDER BY action_count DESC
LIMIT 10;

-- Soft-deleted записи
SELECT
  table_name,
  COUNT(*) as count
FROM audit.soft_deletes
WHERE restored = FALSE
GROUP BY table_name;
```

## Backup and Restore

```bash
# Полный бэкап
pg_dump -d ankey -F c -f ankey_backup.dump

# Только схема
pg_dump -d ankey --schema-only -f ankey_schema.sql

# Только данные
pg_dump -d ankey --data-only -f ankey_data.sql

# Восстановление
pg_restore -d ankey ankey_backup.dump
```

## Миграции

При изменении схемы:

1. Обновить соответствующий `*.definition.sql` файл
2. Создать миграционный скрипт `migrations/YYYY-MM-DD_description.sql`
3. Применить миграцию: `psql -d ankey -f migrations/YYYY-MM-DD_description.sql`
4. Обновить версию в `schema_version` таблице

## Документация

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Архитектурные принципы
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Официальная документация

## Support

При возникновении вопросов или проблем обращайтесь к команде разработки.

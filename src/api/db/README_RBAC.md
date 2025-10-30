# RBAC SQL Files

## 📁 Файлы

### 1. `rbac.definition.sql`
**Назначение:** Определение таблиц для RBAC системы.

**Содержит:**
- Таблица `permissions` - все доступные права в системе
- Таблица `role_permissions` - права по умолчанию для базовых ролей
- Таблица `user_permissions` - переопределение прав для конкретных пользователей
- Таблица `custom_roles` - кастомные роли (опционально)
- Таблица `custom_role_permissions` - права для кастомных ролей
- Индексы для производительности
- Триггеры для audit logging
- Seed data (начальные permissions для всех модулей)

**Когда запускать:**
- При первоначальной настройке RBAC
- При добавлении новых модулей/прав
- При изменении структуры таблиц

### 2. `rbac.functions.sql`
**Назначение:** PostgreSQL функции для проверки и управления правами.

**Содержит:**
- `rbac.has_permission()` - проверка права (основная функция)
- `rbac.get_user_permissions()` - получить все права пользователя
- `rbac.grant_permission()` - выдать право
- `rbac.revoke_permission()` - отозвать право
- `rbac.remove_permission_override()` - удалить переопределение
- `rbac.set_user_context()` - установить контекст для RLS
- `rbac.get_user_context()` - получить текущий контекст
- `rbac.list_permissions()` - список всех прав
- `rbac.get_role_permissions()` - права для базовой роли
- `rbac.check_multiple_permissions()` - проверка нескольких прав (AND)
- `rbac.check_any_permission()` - проверка нескольких прав (OR)
- `rbac.cleanup_expired_permissions()` - очистка истекших прав

**Когда запускать:**
- После `rbac.definition.sql`
- При обновлении логики проверки прав
- При добавлении новых функций

### 3. `rls.policies.sql`
**Назначение:** RLS политики для автоматической изоляции данных.

**Содержит:**
- Helper функции для получения контекста
- RLS политики для всех multi-tenant таблиц:
  - `companies`
  - `user_companies`
  - `tasks`
  - `orgcharts`, `orgchart_approvals`, `orgchart_appointment_history`
  - `approval_matrices`, `approval_workflows`
  - `audit_log`, `audit_sessions`, `audit_soft_deletes`, `audit_reports`
  - `permissions`, `role_permissions`, `user_permissions`
  - `custom_roles`, `custom_role_permissions`
  - `users`

**Когда запускать:**
- После `rbac.definition.sql` и `rbac.functions.sql`
- При добавлении новых таблиц
- При изменении политик доступа

---

## 🚀 Порядок Запуска

### Первоначальная Установка

```bash
# 1. Определения таблиц
psql -f rbac.definition.sql

# 2. Функции RBAC
psql -f rbac.functions.sql

# 3. RLS политики
psql -f rls.policies.sql
```

### Через Deploy Script

```bash
# Обновить src/api/db/00-init-all.sql:
\echo '=== RBAC System ==='
\i rbac.definition.sql
\i rbac.functions.sql
\i rls.policies.sql

# Запустить deploy
bun run src/api/db/deploy-to-supabase.ts
```

---

## 🧪 Тестирование

### Проверка установки

```sql
-- 1. Проверить таблицы
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%permission%';

-- 2. Проверить функции
SELECT proname FROM pg_proc WHERE pronamespace = 'rbac'::regnamespace;

-- 3. Проверить RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 4. Проверить seed data
SELECT COUNT(*) FROM permissions; -- Должно быть > 20
SELECT COUNT(*) FROM role_permissions; -- Должно быть > 50
```

### Функциональное тестирование

```sql
-- Тест 1: Создать тестового пользователя
INSERT INTO users (_id, email, fullname) VALUES ('test_user', 'test@example.com', 'Test User');
INSERT INTO user_companies (user_id, company_id, role)
VALUES ('test_user', '00000000-0000-0000-0000-000000000001'::UUID, 'member');

-- Тест 2: Проверить права
SELECT rbac.has_permission('test_user', '00000000-0000-0000-0000-000000000001'::UUID, 'task.create');
-- Ожидаемый результат: TRUE (member может создавать задачи)

SELECT rbac.has_permission('test_user', '00000000-0000-0000-0000-000000000001'::UUID, 'task.delete');
-- Ожидаемый результат: FALSE (member не может удалять задачи)

-- Тест 3: Выдать дополнительное право
SELECT rbac.grant_permission(
  'owner_user_id',
  'test_user',
  '00000000-0000-0000-0000-000000000001'::UUID,
  'task.delete',
  'For testing'
);

-- Тест 4: Проверить снова
SELECT rbac.has_permission('test_user', '00000000-0000-0000-0000-000000000001'::UUID, 'task.delete');
-- Ожидаемый результат: TRUE (теперь есть grant)

-- Тест 5: Получить все права
SELECT rbac.get_user_permissions('test_user', '00000000-0000-0000-0000-000000000001'::UUID);

-- Тест 6: RLS изоляция
SELECT rbac.set_user_context('test_user', '00000000-0000-0000-0000-000000000001'::UUID);
SELECT * FROM tasks; -- Должен вернуть только задачи этой компании
```

---

## 📝 Добавление Новых Прав

### Шаг 1: Добавить в `rbac.definition.sql`

```sql
-- В секции Seed Data
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('mymodule.create', 'Create mymodule items', 'mymodule', 'create', 'low', 1),
  ('mymodule.read', 'View mymodule items', 'mymodule', 'read', 'low', 1),
  ('mymodule.update', 'Update mymodule items', 'mymodule', 'update', 'medium', 1),
  ('mymodule.delete', 'Delete mymodule items', 'mymodule', 'delete', 'high', 2)
ON CONFLICT (name) DO NOTHING;

-- Назначить права ролям
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'owner', id, TRUE FROM permissions WHERE module = 'mymodule'
ON CONFLICT (role, permission_id) DO NOTHING;

-- ... остальные роли
```

### Шаг 2: Применить изменения

```bash
psql -f rbac.definition.sql
# Или
bun run src/api/db/deploy-to-supabase.ts
```

---

## 🔍 Troubleshooting

### Проблема: RLS блокирует все запросы

**Решение:**
```sql
-- Проверить контекст
SELECT rbac.get_user_context();

-- Установить контекст
SELECT rbac.set_user_context('user_id', 'company_id'::UUID);
```

### Проблема: Permission не найден

**Решение:**
```sql
-- Проверить, существует ли право
SELECT * FROM permissions WHERE name = 'module.action';

-- Если не существует, добавить в rbac.definition.sql и перезапустить
```

### Проблема: Функции RBAC не работают

**Решение:**
```sql
-- Проверить, созданы ли функции
SELECT proname FROM pg_proc WHERE pronamespace = 'rbac'::regnamespace;

-- Если нет, запустить rbac.functions.sql
```

### Проблема: Audit logging не работает

**Решение:**
```sql
-- Проверить триггер
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%audit%';

-- Проверить функцию триггера
SELECT proname FROM pg_proc WHERE proname = 'audit_user_permissions';
```

---

## 📚 Связанные Документы

- [docs/RBAC_ARCHITECTURE.md](../../../docs/RBAC_ARCHITECTURE.md) - Полная архитектура
- [docs/RBAC_IMPLEMENTATION_CHECKLIST.md](../../../docs/RBAC_IMPLEMENTATION_CHECKLIST.md) - Чеклист внедрения
- [docs/RBAC_DEVELOPER_GUIDE.md](../../../docs/RBAC_DEVELOPER_GUIDE.md) - Руководство для разработчиков
- [docs/RBAC_SUMMARY.md](../../../docs/RBAC_SUMMARY.md) - Краткое резюме

---

## 🔐 Безопасность

**Важно:**
- ✅ Все функции используют `SECURITY DEFINER`
- ✅ RLS включен для всех multi-tenant таблиц
- ✅ Audit logging работает для всех изменений прав
- ✅ Контекст проверяется в каждой функции
- ❌ **Никогда** не отключайте RLS на production
- ❌ **Никогда** не используйте `DISABLE ROW LEVEL SECURITY`
- ❌ **Никогда** не обходите проверки прав

---

**Версия:** 1.0.0
**Дата:** 2025-10-30

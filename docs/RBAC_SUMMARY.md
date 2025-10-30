# RBAC System Summary

## 🎯 Что мы создали

Полная система **Role-Based Access Control (RBAC)** для Ankey, которая:

✅ Соответствует Postgres-центричной архитектуре
✅ Использует RLS для автоматической изоляции данных
✅ Поддерживает динамическое управление правами
✅ Интегрируется с audit logging
✅ Масштабируется от простых до сложных сценариев

---

## 📁 Созданные Файлы

### 1. Архитектурная Документация

| Файл | Описание | Для кого |
|------|----------|----------|
| [RBAC_ARCHITECTURE.md](./RBAC_ARCHITECTURE.md) | Полная архитектура RBAC системы | Архитекторы, Tech Leads |
| [RBAC_IMPLEMENTATION_CHECKLIST.md](./RBAC_IMPLEMENTATION_CHECKLIST.md) | Пошаговый чеклист внедрения | Project Managers, Developers |
| [RBAC_DEVELOPER_GUIDE.md](./RBAC_DEVELOPER_GUIDE.md) | Практическое руководство для разработчиков | Developers |

### 2. SQL Schema

| Файл | Описание | Что включает |
|------|----------|--------------|
| [rbac.definition.sql](../src/api/db/rbac.definition.sql) | Схема таблиц для RBAC | `permissions`, `role_permissions`, `user_permissions`, `custom_roles` |
| [rbac.functions.sql](../src/api/db/rbac.functions.sql) | PostgreSQL функции для RBAC | `has_permission()`, `grant_permission()`, `revoke_permission()`, и др. |
| [rls.policies.sql](../src/api/db/rls.policies.sql) | RLS политики для всех таблиц | Tenant isolation, permission-based access |

---

## 🔑 Ключевые Концепции

### 1. Двухуровневая Система Прав

```
Уровень 1: Роли (Role-Based)
├── owner   (все права)
├── admin   (большинство прав)
├── member  (базовые права)
└── guest   (только чтение)

Уровень 2: Permissions (Action-Based)
├── module.create
├── module.read
├── module.update
├── module.delete
└── module.approve
```

### 2. Приоритет Проверки Прав

```sql
1. user_permissions (grant/revoke) - ВЫСШИЙ приоритет
   ↓ если нет override
2. custom_role_permissions (если custom role назначен)
   ↓ если нет custom role
3. role_permissions (базовая роль: owner/admin/member/guest)
```

### 3. RLS Автоматическая Изоляция

```sql
-- Пользователь видит только данные своей компании
CREATE POLICY tenant_isolation ON table_name
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  );
```

---

## 📊 Структура Таблиц

### Основные Таблицы

```
permissions                    role_permissions
┌──────────────┐              ┌──────────────┐
│ id           │              │ id           │
│ name         │◄─────────────│ permission_id│
│ description  │              │ role         │
│ module       │              │ can_delegate │
│ action       │              └──────────────┘
│ risk_level   │
│ min_role_lvl │
└──────────────┘
       ▲
       │
       │
user_permissions
┌──────────────┐
│ id           │
│ user_id      │
│ company_id   │
│ permission_id│
│ grant_type   │  ← 'grant' or 'revoke'
│ granted_by   │
│ reason       │
│ expires_at   │  ← temporary permissions
└──────────────┘
```

---

## 🚀 Как Использовать

### SQL Функция (Backend)

```sql
CREATE OR REPLACE FUNCTION task.create_task(
  _user_id TEXT,
  _company_id UUID,
  _title TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- 1. Set context
  PERFORM rbac.set_user_context(_user_id, _company_id);

  -- 2. Check permission
  IF NOT rbac.has_permission(_user_id, _company_id, 'task.create') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- 3. Perform operation
  INSERT INTO tasks (...) VALUES (...);

  -- 4. Audit log
  PERFORM audit.log_action(...);

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

### TypeScript Service (Client)

```typescript
export class TaskService {
  static async createTask(data: TaskInput) {
    // Check permission for UX
    const hasPermission = await RBACService.hasPermission('task.create');
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    // Call API (PostgreSQL will check permission again)
    return callFunction('task.create_task', {
      user_id: getCurrentUserId(),
      company_id: getCurrentCompanyId(),
      title: data.title,
    });
  }
}
```

### React Component (UI)

```tsx
export function CreateTaskButton() {
  return (
    <PermissionGuard permission="task.create">
      <Button onClick={handleCreate}>Create Task</Button>
    </PermissionGuard>
  );
}
```

---

## 🎯 Основные Функции

### Проверка Прав

```sql
-- Проверить одно право
SELECT rbac.has_permission('user_id', 'company_uuid'::UUID, 'task.create');

-- Получить все права пользователя
SELECT rbac.get_user_permissions('user_id', 'company_uuid'::UUID);

-- Проверить несколько прав (все должны быть)
SELECT rbac.check_multiple_permissions(
  'user_id', 'company_uuid'::UUID,
  ARRAY['task.create', 'task.update']
);

-- Проверить несколько прав (хотя бы одно)
SELECT rbac.check_any_permission(
  'user_id', 'company_uuid'::UUID,
  ARRAY['task.delete', 'orgchart.delete']
);
```

### Управление Правами

```sql
-- Выдать право
SELECT rbac.grant_permission(
  'admin_user_id',                -- кто выдает
  'member_user_id',               -- кому
  'company_uuid'::UUID,           -- в какой компании
  'task.delete',                  -- какое право
  'Needed for cleanup project',  -- причина
  NOW() + INTERVAL '7 days'      -- временно на 7 дней
);

-- Отозвать право
SELECT rbac.revoke_permission(
  'admin_user_id',
  'member_user_id',
  'company_uuid'::UUID,
  'task.delete',
  'No longer needed'
);

-- Удалить override (вернуть к базовой роли)
SELECT rbac.remove_permission_override(
  'admin_user_id',
  'member_user_id',
  'company_uuid'::UUID,
  'task.delete'
);
```

### Context Management

```sql
-- Установить контекст (для RLS)
SELECT rbac.set_user_context('user_id', 'company_uuid'::UUID);

-- Получить текущий контекст
SELECT rbac.get_user_context();
-- Вернет: {"user_id": "...", "company_id": "...", "is_superuser": false}

-- Включить superuser режим (для тестирования)
SELECT set_config('app.is_superuser', 'true', FALSE);
```

---

## 📋 Чеклист для Новой Фичи

При добавлении новой функциональности:

- [ ] **Определить permissions** для модуля
- [ ] **Добавить permissions** в таблицу `permissions`
- [ ] **Назначить permissions** базовым ролям в `role_permissions`
- [ ] **Включить RLS** для таблиц модуля
- [ ] **Обновить SQL функции**:
  - [ ] `rbac.set_user_context()` в начале
  - [ ] `rbac.has_permission()` перед операцией
  - [ ] `audit.log_action()` после операции
- [ ] **Обновить TypeScript service** с проверкой прав
- [ ] **Обернуть UI компоненты** в `<PermissionGuard>`
- [ ] **Добавить i18n переводы** для permissions
- [ ] **Написать тесты** для permissions

---

## 🔍 Ответы на Ваши Вопросы

### 1. Как правильно выстроить RBAC с учетом RLS?

**Ответ:**
- RLS работает **автоматически** на уровне таблиц (изоляция по `company_id`)
- RBAC работает **явно** через функции `rbac.has_permission()`
- Используйте **оба**: RLS для tenant isolation, RBAC для fine-grained контроля

### 2. Что брать за permission: действие на SQL, Hono или React?

**Ответ:**
- **Permission = действие на уровне бизнес-логики** (module.action)
- Проверяется в **SQL функции** (основная проверка)
- Дублируется в **React** (для UX, скрыть кнопки)
- Hono только передает параметры, не проверяет права

### 3. Как динамически изменять level of permissions?

**Ответ:**
```sql
-- Выдать конкретное право (override)
SELECT rbac.grant_permission('admin', 'member', 'company_uuid', 'task.delete');

-- Отозвать право (override)
SELECT rbac.revoke_permission('admin', 'member', 'company_uuid', 'task.delete');

-- Изменить базовую роль
UPDATE user_companies
SET role = 'admin'
WHERE user_id = 'member' AND company_id = 'company_uuid';
```

### 4. Достаточно ли будет: view, edit, create, delete?

**Ответ:**
- **Для большинства модулей - да**
- **Для сложных модулей** добавьте специфичные действия:
  - `approve` - утверждение (DoA, OrgChart, Workflows)
  - `assign` - назначение (Tasks)
  - `appoint` - назначение на должность (OrgChart)
  - `export` - экспорт данных (Audit)

**Рекомендация:** Начните с базовых 4 действий, добавляйте специфичные по мере необходимости.

---

## 📈 Этапы Внедрения

### Quick Start (1-2 дня)

1. Деплой SQL schema (`rbac.definition.sql`, `rbac.functions.sql`)
2. Включить RLS для критичных таблиц (`tasks`, `companies`)
3. Создать `RBACService` и `usePermission` hook
4. Обернуть 2-3 кнопки в `<PermissionGuard>`

### Full Implementation (10-14 дней)

1. ✅ **Phase 1-2:** Database Schema + SQL Functions (3-4 дня)
2. ✅ **Phase 3-4:** API Layer + Client Services (3-4 дня)
3. ✅ **Phase 5-6:** UI Integration + i18n (3-4 дня)
4. ✅ **Phase 7-10:** Testing, Documentation, Deployment (4 дня)

См. [RBAC_IMPLEMENTATION_CHECKLIST.md](./RBAC_IMPLEMENTATION_CHECKLIST.md) для детального плана.

---

## 🎓 Дальнейшие Шаги

1. **Ревью документации** с командой
2. **Утвердить схему** RBAC
3. **Начать Phase 1**: Деплой SQL schema на Supabase
4. **Протестировать** на одном модуле (например, `task`)
5. **Распространить** на остальные модули

---

## 🔗 Полезные Ссылки

- [RBAC_ARCHITECTURE.md](./RBAC_ARCHITECTURE.md) - Полная архитектура
- [RBAC_IMPLEMENTATION_CHECKLIST.md](./RBAC_IMPLEMENTATION_CHECKLIST.md) - Чеклист
- [RBAC_DEVELOPER_GUIDE.md](./RBAC_DEVELOPER_GUIDE.md) - Руководство для разработчиков
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Основная архитектура Ankey

---

## 💡 Ключевые Принципы

1. **PostgreSQL = Permission Server** - все проверки прав в SQL
2. **RLS = Automatic Isolation** - данные фильтруются автоматически
3. **Roles + Permissions** - двухуровневая система прав
4. **Context Management** - user + company context для каждой функции
5. **Audit Everything** - логирование всех изменений прав

---

**Готово к внедрению! 🚀**

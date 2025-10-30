# RBAC Developer Guide

## 🎯 Цель

Это практическое руководство для разработчиков, которые добавляют новую функциональность в Ankey и хотят правильно интегрировать RBAC.

---

## 📖 Быстрый старт

### Когда использовать RBAC?

**Всегда**, когда функция:
- ✅ Создает/изменяет/удаляет данные
- ✅ Показывает чувствительную информацию
- ✅ Выполняет критичные операции (approve, transfer ownership, etc.)
- ✅ Должна быть доступна только определенным ролям

**Не нужно** для:
- ❌ Публичных страниц (landing, login, signup)
- ❌ Чтения собственных данных пользователя (свой профиль)

---

## 🔐 3 уровня защиты

Каждая операция должна быть защищена на **3 уровнях**:

```
1. PostgreSQL (ОБЯЗАТЕЛЬНО) - финальная проверка безопасности
2. Hono API (опционально) - ранний reject для лучшей производительности
3. React UI (обязательно) - UX (скрыть кнопки, которые пользователь не может использовать)
```

---

## 1️⃣ Уровень PostgreSQL (ОБЯЗАТЕЛЬНО)

### Шаг 1: Определить права для модуля

Перед написанием кода, определите, какие права нужны:

```sql
-- Добавить в rbac.definition.sql
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  ('module.create', 'Create module items', 'module', 'create', 'low', 1),
  ('module.read', 'View module items', 'module', 'read', 'low', 1),
  ('module.update', 'Update module items', 'module', 'update', 'medium', 1),
  ('module.delete', 'Delete module items', 'module', 'delete', 'high', 2),
  ('module.approve', 'Approve module changes', 'module', 'approve', 'high', 2)
ON CONFLICT (name) DO NOTHING;
```

**Naming Convention:** `module.action`
- `module` = имя модуля (task, orgchart, doa, company, etc.)
- `action` = действие (create, read, update, delete, approve, assign, export, etc.)

**Risk Levels:**
- `low` - базовые операции (read, create)
- `medium` - изменения данных (update, assign)
- `high` - критичные операции (delete, approve)
- `critical` - системные операции (change_roles, transfer_ownership)

**Min Role Level:**
- `0` = guest (read-only)
- `1` = member
- `2` = admin
- `3` = owner

### Шаг 2: Назначить права ролям

```sql
-- Добавить в rbac.definition.sql (в секции Seed Data)

-- Owner: все права
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'owner', id, TRUE FROM permissions
WHERE module = 'module' AND is_active = TRUE
ON CONFLICT (role, permission_id) DO NOTHING;

-- Admin: все кроме critical
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'admin', id, FALSE FROM permissions
WHERE module = 'module' AND risk_level != 'critical'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Member: только базовые операции
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'member', id, FALSE FROM permissions
WHERE module = 'module' AND action IN ('create', 'read', 'update') AND risk_level = 'low'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Guest: только чтение
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'guest', id, FALSE FROM permissions
WHERE module = 'module' AND action = 'read'
ON CONFLICT (role, permission_id) DO NOTHING;
```

### Шаг 3: Написать SQL функцию с проверкой прав

**Шаблон:**

```sql
CREATE OR REPLACE FUNCTION module.action_name(
  _user_id TEXT,           -- ВСЕГДА первый параметр
  _company_id UUID,        -- ВСЕГДА второй параметр
  -- ... остальные параметры
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_result JSONB;
BEGIN
  -- 1️⃣ Установить контекст для RLS
  PERFORM rbac.set_user_context(_user_id, _company_id);

  -- 2️⃣ Проверить права пользователя
  IF NOT rbac.has_permission(_user_id, _company_id, 'module.action') THEN
    RAISE EXCEPTION 'Permission denied: module.action';
  END IF;

  -- 3️⃣ Сохранить старые значения (для audit)
  SELECT row_to_json(t)::JSONB INTO v_old_values
  FROM table_name t
  WHERE id = _record_id;

  -- 4️⃣ Выполнить операцию
  UPDATE table_name
  SET column1 = _value1, updated_at = NOW()
  WHERE id = _record_id
  RETURNING row_to_json(table_name)::JSONB INTO v_new_values;

  -- 5️⃣ Audit logging (ОБЯЗАТЕЛЬНО)
  PERFORM audit.log_action(
    _user_id,
    'UPDATE',                -- Action type
    'table_name',            -- Table name
    _record_id,              -- Record ID
    _company_id,             -- Company ID
    v_old_values,            -- Old values
    v_new_values,            -- New values
    NULL, NULL, NULL,        -- IP, User-Agent, Session (optional)
    'Description of action'  -- Description
  );

  -- 6️⃣ Вернуть результат
  RETURN jsonb_build_object(
    'success', TRUE,
    'data', v_new_values
  );
END;
$$;
```

**Важно:**
- ✅ `_user_id` и `_company_id` всегда первые два параметра
- ✅ Всегда вызывать `rbac.set_user_context()` в начале
- ✅ Всегда проверять права через `rbac.has_permission()`
- ✅ Всегда логировать в audit
- ✅ Использовать `SECURITY DEFINER` для всех функций

### Шаг 4: Включить RLS для таблицы

```sql
-- Добавить в rls.policies.sql

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policy 1: Tenant isolation (базовая изоляция по компаниям)
CREATE POLICY table_name_tenant_isolation ON table_name
  FOR ALL
  USING (
    rbac.is_superuser() OR
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = rbac.current_user_id()
    )
  )
  WITH CHECK (
    rbac.is_superuser() OR
    company_id = rbac.current_company_id()
  );

-- Policy 2: Permission-based access (опционально, для детального контроля)
CREATE POLICY table_name_read_permission ON table_name
  FOR SELECT
  USING (
    rbac.is_superuser() OR
    rbac.has_permission(
      rbac.current_user_id(),
      company_id,
      'module.read'
    )
  );
```

---

## 2️⃣ Уровень Hono API (опционально)

### Шаг 1: Обновить FUNCTION_PARAMS

```typescript
// src/api/routes/module.routes.ts

const FUNCTION_PARAMS: Record<string, string[]> = {
  "module.action_name": [
    "user_id",      // ← ВСЕГДА первый
    "company_id",   // ← ВСЕГДА второй
    "param1",
    "param2",
    // ...
  ],
};
```

### Шаг 2: Использовать middleware

```typescript
import { rbacContextMiddleware } from "../middleware/rbac-context.middleware";

const app = new Hono();

// Применить middleware ко всем routes
app.use("*", rbacContextMiddleware);

// Универсальный роутер (рекомендуется)
app.post("/:fn", async (c) => {
  const functionName = c.req.param("fn");
  const body = await c.req.json();

  // Автоматически добавляем user_id и company_id из контекста
  const userId = c.get("userId");
  const companyId = c.get("companyId");

  const params = {
    user_id: userId,
    company_id: companyId,
    ...body,
  };

  try {
    const paramOrder = FUNCTION_PARAMS[functionName];
    const orderedParams = paramOrder.map((key) => params[key]);

    const placeholders = orderedParams.map((_, i) => `$${i + 1}`).join(", ");
    const query = `SELECT ${functionName}(${placeholders}) AS result`;

    const result = await pool.query(query, orderedParams);
    return c.json(result.rows[0]?.result || {});
  } catch (error: any) {
    console.error(`[${functionName}] Error:`, error.message);
    return c.json({ error: error.message }, 400);
  }
});
```

---

## 3️⃣ Уровень React UI (обязательно для UX)

### Шаг 1: Создать TypeScript Service

```typescript
// src/modules/module/module-service.ts

import { callFunction } from "@/lib/api";
import { RBACService } from "@/modules/shared/rbac.service";
import { getCurrentUserId, getCurrentCompanyId } from "@/lib/auth-context";

export class ModuleService {
  static async actionName(data: ActionInput) {
    // 1. Проверка прав на клиенте (для UX)
    const hasPermission = await RBACService.hasPermission('module.action');
    if (!hasPermission) {
      throw new Error('You do not have permission to perform this action');
    }

    // 2. Вызов API (PostgreSQL проверит права повторно)
    return callFunction('module.action_name', {
      user_id: getCurrentUserId(),
      company_id: getCurrentCompanyId(),
      ...data,
    });
  }
}
```

### Шаг 2: Обернуть UI компоненты

```tsx
// src/modules/module/components/ModuleActions.tsx

import { PermissionGuard } from "@/modules/shared/components/PermissionGuard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function ModuleActions({ item }) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <PermissionGuard permission="module.update">
        <Button onClick={() => handleEdit(item.id)}>
          {t('common.edit')}
        </Button>
      </PermissionGuard>

      <PermissionGuard permission="module.delete">
        <Button variant="destructive" onClick={() => handleDelete(item.id)}>
          {t('common.delete')}
        </Button>
      </PermissionGuard>

      <PermissionGuard permission="module.approve">
        <Button variant="secondary" onClick={() => handleApprove(item.id)}>
          {t('common.approve')}
        </Button>
      </PermissionGuard>
    </div>
  );
}
```

### Шаг 3: Использовать usePermission hook

```tsx
import { usePermission } from "@/modules/shared/hooks/usePermission";

export function ModulePage() {
  const canCreate = usePermission('module.create');
  const canDelete = usePermission('module.delete');

  return (
    <div>
      <h1>Module Page</h1>

      {canCreate && (
        <Button onClick={handleCreate}>
          Create New Item
        </Button>
      )}

      <DataTable
        columns={columns}
        data={data}
        actions={{
          delete: canDelete ? handleDelete : undefined,
        }}
      />
    </div>
  );
}
```

---

## 🎯 Примеры Реальных Сценариев

### Пример 1: Создание задачи

**SQL функция:**
```sql
CREATE OR REPLACE FUNCTION task.create_task(
  _user_id TEXT,
  _company_id UUID,
  _title TEXT,
  _description TEXT,
  _assignees JSONB
)
RETURNS JSONB AS $$
BEGIN
  PERFORM rbac.set_user_context(_user_id, _company_id);

  IF NOT rbac.has_permission(_user_id, _company_id, 'task.create') THEN
    RAISE EXCEPTION 'Permission denied: task.create';
  END IF;

  INSERT INTO tasks (company_id, creator_id, title, description, assignees)
  VALUES (_company_id, _user_id, _title, _description, _assignees);

  PERFORM audit.log_action(...);

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

**TypeScript Service:**
```typescript
export class TaskService {
  static async createTask(data: CreateTaskInput) {
    const hasPermission = await RBACService.hasPermission('task.create');
    if (!hasPermission) {
      throw new Error('You do not have permission to create tasks');
    }

    return callFunction('task.create_task', {
      user_id: getCurrentUserId(),
      company_id: getCurrentCompanyId(),
      title: data.title,
      description: data.description,
      assignees: data.assignees,
    });
  }
}
```

**React Component:**
```tsx
export function CreateTaskButton() {
  const canCreate = usePermission('task.create');

  if (!canCreate) return null;

  return <Button onClick={handleCreate}>Create Task</Button>;
}
```

### Пример 2: Approve OrgChart (высокий риск)

**SQL:**
```sql
CREATE OR REPLACE FUNCTION orgchart.approve_orgchart(
  _user_id TEXT,
  _company_id UUID,
  _orgchart_id TEXT
)
RETURNS JSONB AS $$
BEGIN
  PERFORM rbac.set_user_context(_user_id, _company_id);

  -- Проверка высокорискового права
  IF NOT rbac.has_permission(_user_id, _company_id, 'orgchart.approve') THEN
    RAISE EXCEPTION 'Permission denied: orgchart.approve (high risk)';
  END IF;

  -- ... approve logic ...

  PERFORM audit.log_action(
    _user_id, 'APPROVE', 'orgcharts', _orgchart_id, _company_id,
    v_old_values, v_new_values,
    NULL, NULL, NULL,
    'OrgChart approved'
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

### Пример 3: Выдача права конкретному пользователю

**Через UI (Admin страница):**
```tsx
export function GrantPermissionDialog({ userId, companyId }) {
  const [selectedPermission, setSelectedPermission] = useState('');

  const handleGrant = async () => {
    await RBACService.grantPermission(
      userId,
      selectedPermission,
      'Needed for project X', // reason
      addDays(new Date(), 7)  // expires in 7 days
    );

    toast.success('Permission granted');
  };

  return (
    <Dialog>
      <Select value={selectedPermission} onValueChange={setSelectedPermission}>
        <SelectItem value="task.delete">Delete Tasks</SelectItem>
        <SelectItem value="orgchart.approve">Approve OrgCharts</SelectItem>
      </Select>

      <Button onClick={handleGrant}>Grant Permission</Button>
    </Dialog>
  );
}
```

**Через SQL (прямой вызов):**
```sql
-- Admin выдает member право на удаление задач (временно на 7 дней)
SELECT rbac.grant_permission(
  'admin_user_id',
  'member_user_id',
  'company_uuid'::UUID,
  'task.delete',
  'Needed for cleanup project',
  NOW() + INTERVAL '7 days'
);
```

---

## 🚨 Частые ошибки

### ❌ Ошибка 1: Забыть установить контекст

```sql
-- ПЛОХО
CREATE OR REPLACE FUNCTION task.create_task(...) AS $$
BEGIN
  -- Забыли rbac.set_user_context()
  INSERT INTO tasks (...) VALUES (...);
END;
$$;
```

**Результат:** RLS заблокирует операцию, так как `app.current_user_id` не установлен.

**Решение:**
```sql
-- ХОРОШО
BEGIN
  PERFORM rbac.set_user_context(_user_id, _company_id); -- ← Добавить
  INSERT INTO tasks (...) VALUES (...);
END;
```

### ❌ Ошибка 2: Проверять права только на клиенте

```typescript
// ПЛОХО - только проверка на клиенте
if (!canDelete) return;

await fetch('/api/task/delete', { ... }); // ← API не проверяет права!
```

**Результат:** Злоумышленник может обойти проверку через curl/Postman.

**Решение:**
```sql
-- ХОРОШО - проверка в SQL функции (ОБЯЗАТЕЛЬНО)
CREATE OR REPLACE FUNCTION task.delete_task(...) AS $$
BEGIN
  IF NOT rbac.has_permission(_user_id, _company_id, 'task.delete') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  -- ...
END;
$$;
```

### ❌ Ошибка 3: Неправильный порядок параметров

```typescript
// ПЛОХО
const FUNCTION_PARAMS = {
  "task.create_task": ["title", "description", "user_id"], // ← user_id должен быть первым!
};
```

**Результат:** PostgreSQL получит параметры в неправильном порядке → ошибка.

**Решение:**
```typescript
// ХОРОШО
const FUNCTION_PARAMS = {
  "task.create_task": ["user_id", "company_id", "title", "description"],
};
```

### ❌ Ошибка 4: Забыть audit logging

```sql
-- ПЛОХО
UPDATE tasks SET title = _title WHERE id = _task_id;
RETURN jsonb_build_object('success', TRUE);
-- ← Нет audit.log_action()!
```

**Результат:** Изменения не отслеживаются для SOC/SoX compliance.

**Решение:**
```sql
-- ХОРОШО
UPDATE tasks SET title = _title WHERE id = _task_id
RETURNING row_to_json(tasks)::JSONB INTO v_new_values;

PERFORM audit.log_action(...); -- ← Добавить
RETURN jsonb_build_object('success', TRUE);
```

---

## 🧪 Как тестировать RBAC

### Тест 1: Проверка прав в psql

```sql
-- Создать тестового пользователя
INSERT INTO users (_id, email, fullname) VALUES ('test_user', 'test@example.com', 'Test User');

-- Добавить в компанию с ролью member
INSERT INTO user_companies (user_id, company_id, role)
VALUES ('test_user', 'company_uuid', 'member');

-- Проверить права
SELECT rbac.has_permission('test_user', 'company_uuid', 'task.create'); -- TRUE
SELECT rbac.has_permission('test_user', 'company_uuid', 'task.delete'); -- FALSE (member не может delete)

-- Выдать дополнительное право
SELECT rbac.grant_permission(
  'owner_user_id',
  'test_user',
  'company_uuid',
  'task.delete',
  'For testing'
);

-- Проверить снова
SELECT rbac.has_permission('test_user', 'company_uuid', 'task.delete'); -- TRUE (теперь есть grant)
```

### Тест 2: RLS изоляция

```sql
-- Компания A
INSERT INTO companies (id, _id, title) VALUES ('company_a_uuid', 'company_a', 'Company A');
INSERT INTO user_companies (user_id, company_id, role) VALUES ('user_a', 'company_a_uuid', 'owner');

-- Компания B
INSERT INTO companies (id, _id, title) VALUES ('company_b_uuid', 'company_b', 'Company B');
INSERT INTO user_companies (user_id, company_id, role) VALUES ('user_b', 'company_b_uuid', 'owner');

-- Создать задачи
INSERT INTO tasks (company_id, title) VALUES ('company_a_uuid', 'Task A');
INSERT INTO tasks (company_id, title) VALUES ('company_b_uuid', 'Task B');

-- Установить контекст user_a
SELECT rbac.set_user_context('user_a', 'company_a_uuid');

-- Проверить, что user_a видит только Task A
SELECT * FROM tasks; -- Должен вернуть только Task A (RLS фильтрует)

-- Установить контекст user_b
SELECT rbac.set_user_context('user_b', 'company_b_uuid');

-- Проверить, что user_b видит только Task B
SELECT * FROM tasks; -- Должен вернуть только Task B
```

### Тест 3: UI тестирование

```typescript
// tests/rbac.spec.ts

test('Member should not see Delete button', async ({ page }) => {
  await page.goto('/tasks');
  await loginAs('member_user');

  const deleteButton = page.locator('button:has-text("Delete")');
  await expect(deleteButton).toBeHidden();
});

test('Admin should see Delete button', async ({ page }) => {
  await page.goto('/tasks');
  await loginAs('admin_user');

  const deleteButton = page.locator('button:has-text("Delete")');
  await expect(deleteButton).toBeVisible();
});
```

---

## 📚 Полезные Функции

### Получить все права пользователя

```sql
SELECT rbac.get_user_permissions('user_id', 'company_uuid');
```

**Результат:**
```json
{
  "role": "member",
  "permissions": [
    {"name": "task.create", "module": "task", "action": "create", "source": "role"},
    {"name": "task.delete", "module": "task", "action": "delete", "source": "grant"}
  ]
}
```

### Проверить несколько прав одновременно

```sql
-- Проверить, что пользователь имеет ВСЕ права
SELECT rbac.check_multiple_permissions(
  'user_id',
  'company_uuid',
  ARRAY['task.create', 'task.update', 'task.assign']
); -- TRUE если все есть

-- Проверить, что пользователь имеет ХОТЯ БЫ ОДНО право
SELECT rbac.check_any_permission(
  'user_id',
  'company_uuid',
  ARRAY['task.delete', 'orgchart.delete']
); -- TRUE если хотя бы одно есть
```

### Получить все overrides пользователя

```sql
SELECT rbac.get_permission_overrides('user_id', 'company_uuid');
```

---

## 🎓 Best Practices

1. **Всегда проверяй права в PostgreSQL функциях** (не только на клиенте)
2. **Используй RLS** для автоматической изоляции данных
3. **Логируй все изменения** в audit.log
4. **Используй PermissionGuard** для UI компонентов
5. **Тестируй RBAC** для каждой новой функции
6. **Документируй** какие права требуются для каждой операции
7. **Используй риск-левелы** правильно (low/medium/high/critical)
8. **Не забывай i18n** для описаний прав

---

## 🔗 Связанные Документы

- [RBAC_ARCHITECTURE.md](./RBAC_ARCHITECTURE.md) - Полная архитектура RBAC
- [RBAC_IMPLEMENTATION_CHECKLIST.md](./RBAC_IMPLEMENTATION_CHECKLIST.md) - Чеклист внедрения
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Общая архитектура Ankey
- [API_PARAMETER_ORDER.md](./API_PARAMETER_ORDER.md) - Порядок параметров API

---

**Happy Coding! 🚀**

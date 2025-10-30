# RBAC Architecture for Ankey

## 🎯 Цель

Разработать **Role-Based Access Control (RBAC) систему**, которая:
- Полностью соответствует **Postgres-центричной архитектуре** ([ARCHITECTURE.md](../ARCHITECTURE.md))
- Использует **RLS (Row Level Security)** для изоляции данных
- Обеспечивает **динамическое управление правами** пользователей
- Интегрируется с существующей системой **audit logging**
- Масштабируется от простых до сложных сценариев

---

## 📊 Текущее Состояние

### Что уже реализовано:
- ✅ Базовая система ролей: `owner`, `admin`, `member` в таблице `user_companies`
- ✅ Функции проверки доступа: `company.has_access()`, `company.get_user_role()`, `company.has_permission()`
- ✅ RLS политики для модуля `orgchart` (эталонная реализация)
- ✅ Session-based контекст: `app.current_company_id` для RLS
- ✅ Audit logging для отслеживания действий

### Что нужно добавить:
- ❌ **Fine-grained permissions** (детализированные права на уровне действий)
- ❌ **RLS политики** для всех multi-tenant таблиц
- ❌ **Permission management** (управление правами через UI)
- ❌ **Custom roles** (кастомные роли с гибкими правами)
- ❌ **Context management** (user + company context для всех функций)
- ❌ **Permission caching** (кеширование прав на клиенте)

---

## 🏗️ Архитектурные Принципы RBAC

### 1. PostgreSQL как Permission Server

**Все проверки прав выполняются в PostgreSQL функциях.**

```sql
-- ✅ ПРАВИЛЬНО: Проверка прав в SQL функции
CREATE OR REPLACE FUNCTION task.create_task(
  _user_id TEXT,
  _company_id UUID,
  _title TEXT,
  -- ...
)
RETURNS JSONB AS $$
BEGIN
  -- 1. Проверяем права пользователя
  IF NOT rbac.has_permission(_user_id, _company_id, 'task.create') THEN
    RAISE EXCEPTION 'Permission denied: task.create';
  END IF;

  -- 2. Выполняем операцию
  INSERT INTO tasks (...) VALUES (...);

  -- 3. Логируем действие
  PERFORM audit.log_action(...);

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

```typescript
// ❌ НЕПРАВИЛЬНО: Проверка прав в TypeScript
static async createTask(data: TaskInput) {
  // Проверка прав в клиенте
  if (!user.hasPermission('task.create')) {
    throw new Error('Permission denied');
  }
  // ...
}
```

### 2. RLS для Автоматической Изоляции Данных

**RLS политики автоматически фильтруют данные по company_id.**

```sql
-- Включаем RLS для таблицы
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Политика: пользователь видит только задачи своей компании
CREATE POLICY tasks_tenant_isolation ON tasks
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
    )
  );
```

### 3. Двухуровневая Система Прав

**Уровень 1: Роли (Role-Based)**
- Простые, предопределенные роли
- Быстрая проверка через иерархию
- Используются для базового контроля доступа

**Уровень 2: Permissions (Action-Based)**
- Детализированные права на конкретные действия
- Гибкая настройка через UI
- Используются для fine-grained контроля

```sql
-- Уровень 1: Проверка роли (простая)
SELECT company.has_permission('user123', 'company456', 'admin');

-- Уровень 2: Проверка конкретного действия (детальная)
SELECT rbac.has_permission('user123', 'company456', 'task.create');
```

### 4. Иерархия Прав

**Permission Inheritance:**
```
owner (все права)
  └─> admin (большинство прав)
       └─> member (базовые права)
            └─> guest (только чтение)
```

**Resource Inheritance:**
```
company.*            (все операции в компании)
  └─> task.*         (все операции с задачами)
       └─> task.create  (только создание задач)
```

---

## 🗄️ Схема Базы Данных для RBAC

### 1. Существующая Таблица: `user_companies`

```sql
-- Уже существует, расширим только роли
CREATE TABLE user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('uc_' || substr(md5(random()::text), 1, 16)),

  user_id TEXT REFERENCES users(_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Роль пользователя (базовые роли)
  role TEXT NOT NULL DEFAULT 'member',
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'guest')),

  joined_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, company_id)
);
```

**Изменения:**
- Добавить роль `'guest'` для read-only доступа
- Остальное без изменений

### 2. Новая Таблица: `permissions`

**Определяет доступные права в системе.**

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('perm_' || substr(md5(random()::text), 1, 16)),

  -- Название права (например: 'task.create', 'orgchart.approve')
  name TEXT UNIQUE NOT NULL,

  -- Описание права
  description TEXT,

  -- Модуль (например: 'task', 'orgchart', 'company')
  module TEXT NOT NULL,

  -- Категория действия (например: 'create', 'read', 'update', 'delete', 'approve')
  action TEXT NOT NULL,

  -- Уровень риска (low, medium, high, critical)
  risk_level TEXT DEFAULT 'low',
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Требуемый минимальный уровень роли (1=member, 2=admin, 3=owner)
  min_role_level INTEGER DEFAULT 1,
  CONSTRAINT valid_role_level CHECK (min_role_level BETWEEN 0 AND 3),

  -- Активность права
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_name ON permissions(name) WHERE is_active = TRUE;

-- Примеры прав
INSERT INTO permissions (name, description, module, action, risk_level, min_role_level) VALUES
  -- Task module
  ('task.create', 'Create new tasks', 'task', 'create', 'low', 1),
  ('task.read', 'View tasks', 'task', 'read', 'low', 1),
  ('task.update', 'Update tasks', 'task', 'update', 'medium', 1),
  ('task.delete', 'Delete tasks', 'task', 'delete', 'high', 2),
  ('task.assign', 'Assign tasks to users', 'task', 'assign', 'medium', 1),
  ('task.approve', 'Approve task completion', 'task', 'approve', 'medium', 2),

  -- OrgChart module
  ('orgchart.create', 'Create new org charts', 'orgchart', 'create', 'medium', 2),
  ('orgchart.read', 'View org charts', 'orgchart', 'read', 'low', 1),
  ('orgchart.update', 'Update org charts', 'orgchart', 'update', 'medium', 2),
  ('orgchart.delete', 'Delete org charts', 'orgchart', 'delete', 'high', 3),
  ('orgchart.approve', 'Approve org chart changes', 'orgchart', 'approve', 'high', 2),
  ('orgchart.appoint', 'Appoint users to positions', 'orgchart', 'appoint', 'high', 2),

  -- DoA module
  ('doa.create', 'Create DoA matrices', 'doa', 'create', 'high', 2),
  ('doa.read', 'View DoA matrices', 'doa', 'read', 'low', 1),
  ('doa.update', 'Update DoA matrices', 'doa', 'update', 'high', 2),
  ('doa.delete', 'Delete DoA matrices', 'doa', 'delete', 'critical', 3),
  ('doa.approve', 'Approve DoA requests', 'doa', 'approve', 'critical', 2),

  -- Company module
  ('company.create', 'Create new companies', 'company', 'create', 'high', 1),
  ('company.read', 'View company info', 'company', 'read', 'low', 1),
  ('company.update', 'Update company settings', 'company', 'update', 'high', 2),
  ('company.delete', 'Delete company', 'company', 'delete', 'critical', 3),
  ('company.invite', 'Invite new members', 'company', 'invite', 'medium', 2),
  ('company.remove_member', 'Remove members', 'company', 'remove_member', 'high', 2),
  ('company.change_roles', 'Change member roles', 'company', 'change_roles', 'critical', 3),

  -- Audit module
  ('audit.read', 'View audit logs', 'audit', 'read', 'medium', 2),
  ('audit.export', 'Export audit reports', 'audit', 'export', 'high', 2);
```

### 3. Новая Таблица: `role_permissions`

**Связывает роли с правами (default permissions для каждой роли).**

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('rp_' || substr(md5(random()::text), 1, 16)),

  -- Роль
  role TEXT NOT NULL,
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'guest')),

  -- Право
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,

  -- Может ли пользователь с этой ролью делегировать это право
  can_delegate BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(role, permission_id)
);

-- Индексы
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- Default permissions для ролей
-- Owner: все права
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'owner', id, TRUE FROM permissions WHERE is_active = TRUE;

-- Admin: все кроме критичных
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'admin', id, FALSE FROM permissions
WHERE is_active = TRUE AND risk_level != 'critical';

-- Member: базовые права
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'member', id, FALSE FROM permissions
WHERE is_active = TRUE AND action IN ('create', 'read', 'update') AND risk_level = 'low';

-- Guest: только чтение
INSERT INTO role_permissions (role, permission_id, can_delegate)
SELECT 'guest', id, FALSE FROM permissions
WHERE is_active = TRUE AND action = 'read';
```

### 4. Новая Таблица: `user_permissions`

**Переопределение прав для конкретного пользователя (overrides).**

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('up_' || substr(md5(random()::text), 1, 16)),

  user_id TEXT REFERENCES users(_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,

  -- Тип override
  grant_type TEXT NOT NULL,
  CONSTRAINT valid_grant_type CHECK (grant_type IN ('grant', 'revoke')),

  -- Кто выдал/отозвал право
  granted_by TEXT REFERENCES users(_id),

  -- Причина
  reason TEXT,

  -- Временные права (NULL = постоянно)
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, company_id, permission_id)
);

-- Индексы
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id, company_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;
```

### 5. Новая Таблица: `custom_roles`

**Кастомные роли с гибкими правами (опционально, для будущего).**

```sql
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL DEFAULT ('cr_' || substr(md5(random()::text), 1, 16)),

  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Название роли
  name TEXT NOT NULL,

  -- Описание
  description TEXT,

  -- Базовая роль, от которой наследуемся
  base_role TEXT NOT NULL,
  CONSTRAINT valid_base_role CHECK (base_role IN ('owner', 'admin', 'member', 'guest')),

  -- Цвет для UI
  color TEXT DEFAULT '#3b82f6',

  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES users(_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id, name)
);

-- Связь custom_role → permissions
CREATE TABLE custom_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id UUID REFERENCES custom_roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(custom_role_id, permission_id)
);

-- Связь user → custom_role
ALTER TABLE user_companies ADD COLUMN custom_role_id UUID REFERENCES custom_roles(id);
CREATE INDEX idx_user_companies_custom_role ON user_companies(custom_role_id);
```

---

## 🔐 RBAC Functions (PostgreSQL)

### 1. Основная Функция: `rbac.has_permission()`

```sql
-- Schema для RBAC функций
CREATE SCHEMA IF NOT EXISTS rbac;

-- Главная функция проверки прав
CREATE OR REPLACE FUNCTION rbac.has_permission(
  _user_id TEXT,
  _company_id UUID,
  _permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_company RECORD;
  v_permission_id UUID;
  v_has_permission BOOLEAN := FALSE;
  v_user_override TEXT;
BEGIN
  -- 1. Проверяем членство в компании
  SELECT uc.role, uc.custom_role_id
  INTO v_user_company
  FROM user_companies uc
  WHERE uc.user_id = _user_id AND uc.company_id = _company_id;

  IF v_user_company.role IS NULL THEN
    RETURN FALSE; -- Пользователь не в компании
  END IF;

  -- 2. Получаем ID права
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = _permission_name AND is_active = TRUE;

  IF v_permission_id IS NULL THEN
    RETURN FALSE; -- Право не существует
  END IF;

  -- 3. Проверяем user_permissions (overrides)
  SELECT grant_type INTO v_user_override
  FROM user_permissions
  WHERE user_id = _user_id
    AND company_id = _company_id
    AND permission_id = v_permission_id
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_user_override = 'revoke' THEN
    RETURN FALSE; -- Явный отзыв права
  END IF;

  IF v_user_override = 'grant' THEN
    RETURN TRUE; -- Явная выдача права
  END IF;

  -- 4. Проверяем custom_role (если есть)
  IF v_user_company.custom_role_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM custom_role_permissions crp
      WHERE crp.custom_role_id = v_user_company.custom_role_id
        AND crp.permission_id = v_permission_id
    ) INTO v_has_permission;

    IF v_has_permission THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- 5. Проверяем базовую роль
  SELECT EXISTS(
    SELECT 1 FROM role_permissions rp
    WHERE rp.role = v_user_company.role
      AND rp.permission_id = v_permission_id
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;
```

### 2. Функция: `rbac.get_user_permissions()`

```sql
-- Получить все права пользователя в компании
CREATE OR REPLACE FUNCTION rbac.get_user_permissions(
  _user_id TEXT,
  _company_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_user_company RECORD;
BEGIN
  -- Получаем роль пользователя
  SELECT role, custom_role_id INTO v_user_company
  FROM user_companies
  WHERE user_id = _user_id AND company_id = _company_id;

  IF v_user_company.role IS NULL THEN
    RETURN jsonb_build_object('permissions', '[]'::JSONB);
  END IF;

  -- Собираем все права
  WITH all_permissions AS (
    -- Права от базовой роли
    SELECT DISTINCT p.name, p.description, p.module, p.action, 'role' AS source
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = v_user_company.role AND p.is_active = TRUE

    UNION

    -- Права от custom_role
    SELECT DISTINCT p.name, p.description, p.module, p.action, 'custom_role' AS source
    FROM custom_role_permissions crp
    JOIN permissions p ON p.id = crp.permission_id
    WHERE crp.custom_role_id = v_user_company.custom_role_id AND p.is_active = TRUE

    UNION

    -- Явно выданные права
    SELECT DISTINCT p.name, p.description, p.module, p.action, 'grant' AS source
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id
      AND up.company_id = _company_id
      AND up.grant_type = 'grant'
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
      AND p.is_active = TRUE
  ),
  revoked_permissions AS (
    -- Явно отозванные права
    SELECT p.name
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id
      AND up.company_id = _company_id
      AND up.grant_type = 'revoke'
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
  )
  SELECT jsonb_build_object(
    'role', v_user_company.role,
    'permissions', jsonb_agg(
      jsonb_build_object(
        'name', ap.name,
        'description', ap.description,
        'module', ap.module,
        'action', ap.action,
        'source', ap.source
      )
    )
  ) INTO v_result
  FROM all_permissions ap
  WHERE ap.name NOT IN (SELECT name FROM revoked_permissions);

  RETURN v_result;
END;
$$;
```

### 3. Функция: `rbac.grant_permission()`

```sql
-- Выдать право пользователю
CREATE OR REPLACE FUNCTION rbac.grant_permission(
  _granted_by TEXT,
  _user_id TEXT,
  _company_id UUID,
  _permission_name TEXT,
  _reason TEXT DEFAULT NULL,
  _expires_at TIMESTAMP DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permission_id UUID;
BEGIN
  -- 1. Проверяем, может ли _granted_by выдавать права
  IF NOT rbac.has_permission(_granted_by, _company_id, 'company.change_roles') THEN
    RAISE EXCEPTION 'Permission denied: cannot grant permissions';
  END IF;

  -- 2. Получаем ID права
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = _permission_name AND is_active = TRUE;

  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %', _permission_name;
  END IF;

  -- 3. Вставляем/обновляем user_permissions
  INSERT INTO user_permissions (
    user_id, company_id, permission_id, grant_type, granted_by, reason, expires_at
  )
  VALUES (
    _user_id, _company_id, v_permission_id, 'grant', _granted_by, _reason, _expires_at
  )
  ON CONFLICT (user_id, company_id, permission_id)
  DO UPDATE SET
    grant_type = 'grant',
    granted_by = _granted_by,
    reason = _reason,
    expires_at = _expires_at,
    created_at = NOW();

  -- 4. Логируем в audit
  PERFORM audit.log_action(
    _granted_by,
    'GRANT_PERMISSION',
    'user_permissions',
    _user_id,
    _company_id,
    NULL,
    jsonb_build_object(
      'permission', _permission_name,
      'expires_at', _expires_at
    ),
    NULL, NULL, NULL,
    format('Granted permission %s to user %s', _permission_name, _user_id)
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

### 4. Функция: `rbac.revoke_permission()`

```sql
-- Отозвать право пользователя
CREATE OR REPLACE FUNCTION rbac.revoke_permission(
  _revoked_by TEXT,
  _user_id TEXT,
  _company_id UUID,
  _permission_name TEXT,
  _reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permission_id UUID;
BEGIN
  -- 1. Проверяем права
  IF NOT rbac.has_permission(_revoked_by, _company_id, 'company.change_roles') THEN
    RAISE EXCEPTION 'Permission denied: cannot revoke permissions';
  END IF;

  -- 2. Получаем ID права
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = _permission_name AND is_active = TRUE;

  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %', _permission_name;
  END IF;

  -- 3. Вставляем/обновляем user_permissions
  INSERT INTO user_permissions (
    user_id, company_id, permission_id, grant_type, granted_by, reason
  )
  VALUES (
    _user_id, _company_id, v_permission_id, 'revoke', _revoked_by, _reason
  )
  ON CONFLICT (user_id, company_id, permission_id)
  DO UPDATE SET
    grant_type = 'revoke',
    granted_by = _revoked_by,
    reason = _reason,
    expires_at = NULL,
    created_at = NOW();

  -- 4. Логируем в audit
  PERFORM audit.log_action(
    _revoked_by,
    'REVOKE_PERMISSION',
    'user_permissions',
    _user_id,
    _company_id,
    jsonb_build_object('permission', _permission_name),
    NULL,
    NULL, NULL, NULL,
    format('Revoked permission %s from user %s', _permission_name, _user_id)
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

### 5. Helper Function: `rbac.set_user_context()`

```sql
-- Установить user + company контекст для RLS
CREATE OR REPLACE FUNCTION rbac.set_user_context(
  _user_id TEXT,
  _company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.current_user_id', _user_id, FALSE);
  PERFORM set_config('app.current_company_id', _company_id::TEXT, FALSE);
END;
$$;
```

---

## 🔒 RLS Policies (Шаблоны)

### Шаблон 1: Tenant Isolation (Multi-Company)

**Для таблиц с `company_id`:**

```sql
-- Пример: tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: пользователь видит только задачи своей компании
CREATE POLICY tasks_tenant_isolation ON tasks
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
    )
  );

-- Policy: суперпользователь видит все (для админки)
CREATE POLICY tasks_superuser_access ON tasks
  USING (current_setting('app.is_superuser', TRUE) = 'true');
```

### Шаблон 2: Creator-Based Access

**Для таблиц с `created_by` или `user_id`:**

```sql
-- Пример: user_companies (пользователь видит только свои членства)
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_companies_own_memberships ON user_companies
  USING (
    user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
  );

-- Админы компании видят всех членов
CREATE POLICY user_companies_admin_view ON user_companies
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
        AND role IN ('owner', 'admin')
    )
  );
```

### Шаблон 3: Permission-Based Access

**Для таблиц, требующих проверки конкретных прав:**

```sql
-- Пример: audit_log (только с правом audit.read)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_permission_based ON audit_log
  USING (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
        AND rbac.has_permission(
          uc.user_id,
          uc.company_id,
          'audit.read'
        )
    )
  );
```

### Шаблон 4: Assignee-Based Access

**Для задач/workflow, где пользователь видит только назначенное ему:**

```sql
-- Пример: tasks (пользователь видит свои задачи + задачи компании)
CREATE POLICY tasks_assignee_access ON tasks
  USING (
    -- Tenant isolation (базовое условие)
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
    )
    AND (
      -- Либо создатель
      creator_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
      OR
      -- Либо назначенный исполнитель
      assignees @> jsonb_build_array(
        jsonb_build_object('type', 'user', 'id', current_setting('app.current_user_id', TRUE))
      )
      OR
      -- Либо член компании с правом task.read
      rbac.has_permission(
        NULLIF(current_setting('app.current_user_id', TRUE), ''),
        company_id,
        'task.read'
      )
    )
  );
```

---

## 🚀 Порядок Внедрения RBAC

### Phase 1: Database Schema (1-2 дня)

**Цель:** Создать таблицы и функции для RBAC.

**Задачи:**
1. ✅ Создать файл `src/api/db/rbac.definition.sql`:
   - Таблицы: `permissions`, `role_permissions`, `user_permissions`
   - Индексы для производительности
   - Начальные данные (seed permissions)

2. ✅ Создать файл `src/api/db/rbac.functions.sql`:
   - `rbac.has_permission()`
   - `rbac.get_user_permissions()`
   - `rbac.grant_permission()`
   - `rbac.revoke_permission()`
   - `rbac.set_user_context()`

3. ✅ Обновить `src/api/db/00-init-all.sql`:
   - Добавить инициализацию RBAC schema

4. ✅ Миграция для `user_companies`:
   - Добавить роль `'guest'` в CHECK constraint

**Чеклист Phase 1:**
- [ ] SQL файлы созданы
- [ ] Функции протестированы через psql
- [ ] Начальные permissions добавлены
- [ ] Индексы созданы
- [ ] Audit logging интегрирован

---

### Phase 2: RLS Policies (2-3 дня)

**Цель:** Внедрить RLS для всех multi-tenant таблиц.

**Задачи:**
1. ✅ Создать файл `src/api/db/rls.policies.sql`:
   - RLS для `tasks`
   - RLS для `companies`
   - RLS для `user_companies`
   - RLS для `approval_matrices`
   - RLS для `approval_workflows`
   - RLS для `audit_log`

2. ✅ Обновить существующие SQL функции:
   - Добавить `rbac.set_user_context()` в начало каждой функции
   - Пример:
     ```sql
     CREATE OR REPLACE FUNCTION task.create_task(...)
     BEGIN
       -- 1. Установить контекст
       PERFORM rbac.set_user_context(_user_id, _company_id);

       -- 2. Проверить права
       IF NOT rbac.has_permission(_user_id, _company_id, 'task.create') THEN
         RAISE EXCEPTION 'Permission denied';
       END IF;

       -- 3. Выполнить операцию
       INSERT INTO tasks (...) VALUES (...);
     END;
     ```

3. ✅ Тестирование RLS:
   - Создать тестовых пользователей с разными ролями
   - Проверить изоляцию данных между компаниями
   - Проверить, что суперпользователь видит все

**Чеклист Phase 2:**
- [ ] RLS включен для всех таблиц
- [ ] Policies протестированы
- [ ] Context management работает
- [ ] Нет утечек данных между компаниями

---

### Phase 3: Function-Level Enforcement (3-4 дня)

**Цель:** Добавить проверку прав во все SQL функции.

**Модули для обновления:**
1. ✅ `src/api/db/task.functions.sql`
   - `task.create_task()` → check `task.create`
   - `task.update_task()` → check `task.update`
   - `task.delete_task()` → check `task.delete`
   - `task.assign_task()` → check `task.assign`

2. ✅ `src/api/db/company.functions.sql`
   - `company.update_company()` → check `company.update`
   - `company.invite_member()` → check `company.invite`
   - `company.remove_member()` → check `company.remove_member`
   - `company.update_member_role()` → check `company.change_roles`

3. ✅ `src/api/db/doa.functions.sql`
   - Добавить функции CRUD для DoA
   - Каждая функция проверяет права

4. ✅ `src/api/db/orgchart.functions.sql`
   - Обновить существующие функции
   - Добавить проверки прав

**Шаблон для обновления функций:**

```sql
CREATE OR REPLACE FUNCTION module.action_name(
  _user_id TEXT,
  _company_id UUID,
  -- ...
)
RETURNS JSONB AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- 1. Set context для RLS
  PERFORM rbac.set_user_context(_user_id, _company_id);

  -- 2. Check permission
  IF NOT rbac.has_permission(_user_id, _company_id, 'module.action') THEN
    RAISE EXCEPTION 'Permission denied: module.action';
  END IF;

  -- 3. Perform operation
  -- ...

  -- 4. Audit log
  PERFORM audit.log_action(
    _user_id, 'ACTION', 'table_name',
    record_id, _company_id,
    v_old_values, v_new_values,
    NULL, NULL, NULL,
    'Description of action'
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

**Чеклист Phase 3:**
- [ ] Все функции проверяют права
- [ ] Context устанавливается в начале функции
- [ ] Audit logging работает
- [ ] Тесты для каждого модуля

---

### Phase 4: API Layer (1-2 дня)

**Цель:** Обновить Hono API для передачи user_id и company_id.

**Задачи:**
1. ✅ Обновить `src/api/routes/*.routes.ts`:
   - Извлекать `user_id` и `company_id` из session/token
   - Передавать в PostgreSQL функции как первые параметры

2. ✅ Создать middleware `rbac-context.middleware.ts`:
   ```typescript
   import { Hono } from "hono";

   export const rbacContextMiddleware = async (c, next) => {
     // Извлечь user_id из session/JWT
     const userId = c.get("userId"); // Из auth middleware
     const companyId = c.req.header("X-Company-Id"); // Из headers

     if (!userId) {
       return c.json({ error: "Unauthorized" }, 401);
     }

     c.set("userId", userId);
     c.set("companyId", companyId);

     await next();
   };
   ```

3. ✅ Обновить `FUNCTION_PARAMS` маппинг:
   - Добавить `user_id` и `company_id` как первые параметры для всех функций

**Чеклист Phase 4:**
- [ ] Middleware создан
- [ ] Все routes используют middleware
- [ ] FUNCTION_PARAMS обновлен
- [ ] Context передается в SQL функции

---

### Phase 5: Client Services (2-3 дня)

**Цель:** Обновить TypeScript сервисы для работы с RBAC.

**Задачи:**
1. ✅ Создать `src/modules/shared/rbac.service.ts`:
   ```typescript
   export class RBACService {
     static async hasPermission(permission: string): Promise<boolean> {
       const response = await callFunction("rbac.has_permission", {
         user_id: getCurrentUserId(),
         company_id: getCurrentCompanyId(),
         permission_name: permission,
       });
       return response.hasPermission;
     }

     static async getUserPermissions() {
       return callFunction("rbac.get_user_permissions", {
         user_id: getCurrentUserId(),
         company_id: getCurrentCompanyId(),
       });
     }

     static async grantPermission(userId: string, permission: string) {
       return callFunction("rbac.grant_permission", {
         granted_by: getCurrentUserId(),
         user_id: userId,
         company_id: getCurrentCompanyId(),
         permission_name: permission,
       });
     }
   }
   ```

2. ✅ Создать React hook `usePermission()`:
   ```typescript
   export function usePermission(permission: string) {
     const [hasPermission, setHasPermission] = useState(false);

     useEffect(() => {
       RBACService.hasPermission(permission).then(setHasPermission);
     }, [permission]);

     return hasPermission;
   }
   ```

3. ✅ Создать HOC `<PermissionGuard>`:
   ```typescript
   export function PermissionGuard({
     permission,
     children,
     fallback = null
   }) {
     const hasPermission = usePermission(permission);
     return hasPermission ? children : fallback;
   }
   ```

**Чеклист Phase 5:**
- [ ] RBACService создан
- [ ] usePermission hook работает
- [ ] PermissionGuard компонент создан
- [ ] Интеграция с существующими сервисами

---

### Phase 6: UI Integration (2-3 дня)

**Цель:** Интегрировать RBAC в пользовательский интерфейс.

**Задачи:**
1. ✅ Создать страницу `/settings/permissions`:
   - Список членов компании
   - Редактирование ролей
   - Выдача/отзыв конкретных прав
   - История изменений прав

2. ✅ Обновить существующие компоненты:
   - Обернуть кнопки в `<PermissionGuard>`
   - Пример:
     ```tsx
     <PermissionGuard permission="task.create">
       <Button onClick={createTask}>Create Task</Button>
     </PermissionGuard>
     ```

3. ✅ Добавить permission-based routing:
   ```typescript
   {
     path: "/audit",
     element: (
       <PermissionGuard permission="audit.read">
         <AuditPage />
       </PermissionGuard>
     )
   }
   ```

4. ✅ i18n поддержка:
   - Добавить переводы для всех permission descriptions
   - Добавить переводы для RBAC UI

**Чеклист Phase 6:**
- [ ] Страница permissions создана
- [ ] Компоненты обернуты в PermissionGuard
- [ ] Routing защищен
- [ ] i18n переводы добавлены

---

### Phase 7: Testing & Documentation (2-3 дня)

**Цель:** Протестировать RBAC систему и создать документацию.

**Задачи:**
1. ✅ Unit тесты для SQL функций:
   - Тесты для `rbac.has_permission()`
   - Тесты для permission overrides
   - Тесты для RLS policies

2. ✅ Integration тесты:
   - Создать пользователей с разными ролями
   - Проверить доступ к разным модулям
   - Проверить audit logging

3. ✅ E2E тесты:
   - Signup → Join company → Assign role → Test permissions
   - Owner invites member → Member tries restricted action → Denied
   - Admin changes member role → Member gets new permissions

4. ✅ Документация:
   - Обновить [ARCHITECTURE.md](../ARCHITECTURE.md)
   - Создать руководство для разработчиков
   - Создать руководство для администраторов

**Чеклист Phase 7:**
- [ ] Тесты написаны и проходят
- [ ] Документация обновлена
- [ ] Примеры использования созданы
- [ ] Security audit пройден

---

## 📋 Чеклист для Внедрения RBAC в Модуль

При добавлении RBAC в новый или существующий модуль:

- [ ] **Определить permissions** для модуля (create, read, update, delete, etc.)
- [ ] **Добавить permissions** в таблицу `permissions` (через INSERT)
- [ ] **Назначить permissions** базовым ролям в `role_permissions`
- [ ] **Включить RLS** для таблиц модуля (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] **Создать RLS policies** (tenant isolation + permission-based)
- [ ] **Обновить SQL функции** модуля:
  - Добавить `PERFORM rbac.set_user_context(_user_id, _company_id)` в начало
  - Добавить `IF NOT rbac.has_permission(...) THEN RAISE EXCEPTION` перед операцией
  - Добавить `PERFORM audit.log_action(...)` после операции
- [ ] **Обновить TypeScript service**:
  - Использовать `RBACService.hasPermission()` перед API вызовами
- [ ] **Обернуть UI компоненты** в `<PermissionGuard>`
- [ ] **Добавить i18n переводы** для permissions
- [ ] **Написать тесты** для permissions
- [ ] **Обновить документацию** модуля

---

## 🎓 Примеры Использования

### Пример 1: Проверка права в SQL функции

```sql
CREATE OR REPLACE FUNCTION task.update_task(
  _user_id TEXT,
  _company_id UUID,
  _task_id TEXT,
  _title TEXT,
  _description TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- 1. Установить контекст
  PERFORM rbac.set_user_context(_user_id, _company_id);

  -- 2. Проверить право
  IF NOT rbac.has_permission(_user_id, _company_id, 'task.update') THEN
    RAISE EXCEPTION 'Permission denied: task.update';
  END IF;

  -- 3. Обновить задачу (RLS автоматически проверит company_id)
  UPDATE tasks
  SET title = _title, description = _description
  WHERE _id = _task_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;
```

### Пример 2: Использование в TypeScript

```typescript
// src/modules/task/task-service.ts
export class TaskService {
  static async updateTask(taskId: string, data: UpdateTaskInput) {
    // Проверка прав на клиенте (для UX)
    const hasPermission = await RBACService.hasPermission('task.update');
    if (!hasPermission) {
      throw new Error('You do not have permission to update tasks');
    }

    // Вызов API (PostgreSQL проверит права повторно)
    return callFunction('task.update_task', {
      user_id: getCurrentUserId(),
      company_id: getCurrentCompanyId(),
      task_id: taskId,
      title: data.title,
      description: data.description,
    });
  }
}
```

### Пример 3: UI компонент с RBAC

```tsx
// src/modules/task/components/TaskActions.tsx
export function TaskActions({ task }: { task: Task }) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <PermissionGuard permission="task.update">
        <Button onClick={() => editTask(task.id)}>
          {t('common.edit')}
        </Button>
      </PermissionGuard>

      <PermissionGuard permission="task.delete">
        <Button variant="destructive" onClick={() => deleteTask(task.id)}>
          {t('common.delete')}
        </Button>
      </PermissionGuard>
    </div>
  );
}
```

### Пример 4: Динамическая выдача права

```sql
-- Admin выдает конкретному пользователю право на удаление задач
SELECT rbac.grant_permission(
  'admin_user_id',        -- кто выдает
  'member_user_id',       -- кому выдается
  'company_uuid',         -- в какой компании
  'task.delete',          -- какое право
  'Needed for project X', -- причина
  NOW() + INTERVAL '7 days' -- временно на 7 дней
);

-- Проверка права
SELECT rbac.has_permission('member_user_id', 'company_uuid', 'task.delete');
-- Вернет TRUE (даже если базовая роль 'member' не имеет task.delete)
```

---

## 🔍 FAQ

### 1. Что использовать: Роли или Permissions?

**Роли (owner/admin/member):**
- Для **быстрой проверки** базового доступа
- Для **UI**: показать/скрыть разделы меню
- Для **простых сценариев**: "только админы могут пригласить пользователей"

**Permissions (task.create, orgchart.approve):**
- Для **детального контроля** конкретных действий
- Для **аудита**: точно знать, кто что может делать
- Для **гибкой настройки**: выдать member право approve без повышения до admin

**Рекомендация:**
- Используй **роли** для проверки членства и базового доступа
- Используй **permissions** для проверки конкретных операций в функциях

### 2. Нужно ли проверять права и на клиенте, и на сервере?

**Да, обязательно!**

**На клиенте (TypeScript/React):**
- Для **UX**: скрыть кнопки, которые пользователь не может использовать
- Для **производительности**: не делать бессмысленные запросы
- **НЕ для безопасности** (клиент может быть взломан)

**На сервере (PostgreSQL):**
- Для **безопасности**: финальная проверка прав
- Для **аудита**: логирование попыток несанкционированного доступа
- **Обязательно** в каждой функции, изменяющей данные

### 3. Достаточно ли 4 уровней прав (view, create, update, delete)?

**Для большинства модулей - да.**

**Базовые действия:**
- `read` (view) - просмотр
- `create` - создание
- `update` (edit) - изменение
- `delete` - удаление

**Дополнительные действия (для сложных модулей):**
- `approve` - утверждение (DoA, OrgChart, Workflows)
- `assign` - назначение (Tasks)
- `appoint` - назначение на должность (OrgChart)
- `invite` - приглашение пользователей (Company)
- `export` - экспорт данных (Audit)

**Рекомендация:**
- Начни с базовых 4 действий
- Добавляй специфичные действия по мере необходимости
- Используй naming convention: `module.action` (например: `task.approve`, `orgchart.appoint`)

### 4. Как обрабатывать иерархию прав?

**Подход 1: Явная проверка (рекомендуется)**

```sql
-- Проверяем конкретное право
IF NOT rbac.has_permission(_user_id, _company_id, 'task.delete') THEN
  RAISE EXCEPTION 'Permission denied';
END IF;
```

**Подход 2: Иерархия ролей (для backward compatibility)**

```sql
-- Owner наследует все права admin
-- Admin наследует все права member
SELECT company.has_permission(_user_id, _company_id, 'admin');
-- Вернет TRUE для owner и admin
```

**Рекомендация:**
- Используй **явную проверку** permissions для новых функций
- Оставь **иерархию ролей** для существующих функций (company.has_permission)
- Не смешивай оба подхода в одной функции

### 5. Как внедрить RBAC в существующий модуль?

**Пошаговый план:**

1. **Определи permissions:**
   ```sql
   INSERT INTO permissions (name, description, module, action, risk_level) VALUES
     ('module.create', 'Create module items', 'module', 'create', 'low'),
     ('module.read', 'View module items', 'module', 'read', 'low'),
     ('module.update', 'Update module items', 'module', 'update', 'medium'),
     ('module.delete', 'Delete module items', 'module', 'delete', 'high');
   ```

2. **Включи RLS:**
   ```sql
   ALTER TABLE module_table ENABLE ROW LEVEL SECURITY;

   CREATE POLICY module_table_tenant_isolation ON module_table
     USING (company_id IN (
       SELECT company_id FROM user_companies
       WHERE user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')
     ));
   ```

3. **Обнови SQL функции:**
   ```sql
   CREATE OR REPLACE FUNCTION module.create_item(
     _user_id TEXT,  -- Добавь параметр
     _company_id UUID,  -- Добавь параметр
     ...
   ) AS $$
   BEGIN
     PERFORM rbac.set_user_context(_user_id, _company_id);  -- Добавь
     IF NOT rbac.has_permission(_user_id, _company_id, 'module.create') THEN  -- Добавь
       RAISE EXCEPTION 'Permission denied';  -- Добавь
     END IF;
     -- Существующий код...
   END;
   $$;
   ```

4. **Обнови TypeScript service:**
   ```typescript
   static async createItem(data: ItemInput) {
     // Добавь проверку прав
     const hasPermission = await RBACService.hasPermission('module.create');
     if (!hasPermission) {
       throw new Error('Permission denied');
     }

     // Передай user_id и company_id в API
     return callFunction('module.create_item', {
       user_id: getCurrentUserId(),
       company_id: getCurrentCompanyId(),
       ...data,
     });
   }
   ```

5. **Обнови UI:**
   ```tsx
   <PermissionGuard permission="module.create">
     <Button onClick={createItem}>Create</Button>
   </PermissionGuard>
   ```

---

## 📖 Связанные Документы

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Основная архитектура Ankey
- [docs/API_PARAMETER_ORDER.md](./API_PARAMETER_ORDER.md) - Порядок параметров для API
- [docs/AUTO-GENERATED-ON-COMPANY-CREATION.md](./AUTO-GENERATED-ON-COMPANY-CREATION.md) - Авто-создание ресурсов

---

## ✅ Следующие Шаги

1. **Ревью этого документа** с командой
2. **Утвердить** схему RBAC
3. **Начать Phase 1**: Создать SQL schema для RBAC
4. **Протестировать** на одном модуле (например, `task`)
5. **Распространить** на остальные модули

---

## 🎓 Заключение

**RBAC система для Ankey:**
- ✅ Полностью соответствует Postgres-центричной архитектуре
- ✅ Использует RLS для автоматической изоляции данных
- ✅ Поддерживает динамическое управление правами
- ✅ Масштабируется от простых до сложных сценариев
- ✅ Интегрируется с audit logging для SOC/SoX compliance

**Ключевые принципы:**
1. **PostgreSQL = Permission Server** (все проверки прав в SQL)
2. **RLS = Automatic Isolation** (данные фильтруются автоматически)
3. **Roles + Permissions** (двухуровневая система прав)
4. **Context Management** (user + company context для каждой функции)
5. **Audit Everything** (логирование всех изменений прав)

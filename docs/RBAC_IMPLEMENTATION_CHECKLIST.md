# RBAC Implementation Checklist

## 📋 Быстрый Чеклист для Внедрения RBAC

Используйте этот документ как практическое руководство для пошагового внедрения RBAC в Ankey.

---

## Phase 1: Database Schema Setup ⏱️ 1-2 дня

### 1.1 Создать SQL файлы

- [ ] **Создан файл** `src/api/db/rbac.definition.sql`
  - [ ] Таблица `permissions` создана
  - [ ] Таблица `role_permissions` создана
  - [ ] Таблица `user_permissions` создана
  - [ ] Таблица `custom_roles` создана (опционально)
  - [ ] Таблица `custom_role_permissions` создана (опционально)
  - [ ] Индексы добавлены
  - [ ] Триггеры для audit logging добавлены
  - [ ] Seed data (начальные permissions) добавлены

- [ ] **Создан файл** `src/api/db/rbac.functions.sql`
  - [ ] Функция `rbac.has_permission()` создана
  - [ ] Функция `rbac.get_user_permissions()` создана
  - [ ] Функция `rbac.grant_permission()` создана
  - [ ] Функция `rbac.revoke_permission()` создана
  - [ ] Функция `rbac.set_user_context()` создана
  - [ ] Функция `rbac.get_user_context()` создана
  - [ ] Функция `rbac.list_permissions()` создана
  - [ ] Функция `rbac.get_role_permissions()` создана
  - [ ] Функция `rbac.cleanup_expired_permissions()` создана

- [ ] **Создан файл** `src/api/db/rls.policies.sql`
  - [ ] RLS для `companies` включен
  - [ ] RLS для `user_companies` включен
  - [ ] RLS для `tasks` включен
  - [ ] RLS для `approval_matrices` включен
  - [ ] RLS для `approval_workflows` включен
  - [ ] RLS для `audit_log` включен
  - [ ] RLS для `audit_sessions` включен
  - [ ] RLS для `permissions` включен
  - [ ] RLS для `users` включен

### 1.2 Обновить существующие файлы

- [ ] **Обновить** `src/api/db/00-init-all.sql`
  - [ ] Добавлена инициализация RBAC schema
  - [ ] Добавлен `\i rbac.definition.sql`
  - [ ] Добавлен `\i rbac.functions.sql`
  - [ ] Добавлен `\i rls.policies.sql`

- [ ] **Обновить** `user_companies` таблицу
  - [ ] CHECK constraint обновлен (добавлена роль 'guest')
  - [ ] Колонка `custom_role_id` добавлена

### 1.3 Деплой на Supabase

- [ ] **Запустить** `src/api/db/deploy-to-supabase.ts`
  - [ ] RBAC schema создан
  - [ ] Таблицы созданы
  - [ ] Функции созданы
  - [ ] RLS политики применены
  - [ ] Seed data загружен

### 1.4 Тестирование SQL

- [ ] **Протестировать permissions**
  ```sql
  -- Test 1: List all permissions
  SELECT * FROM rbac.list_permissions();

  -- Test 2: Get owner permissions
  SELECT * FROM rbac.get_role_permissions('owner');

  -- Test 3: Check user permission
  SELECT rbac.has_permission('user_id', 'company_id'::UUID, 'task.create');
  ```

- [ ] **Протестировать RLS**
  ```sql
  -- Test 1: Set context
  SELECT rbac.set_user_context('user_id', 'company_id'::UUID);

  -- Test 2: Query with RLS
  SELECT * FROM tasks; -- Should only show tasks for context company

  -- Test 3: Clear context
  SELECT set_config('app.current_user_id', '', FALSE);
  ```

---

## Phase 2: Update Existing SQL Functions ⏱️ 2-3 дня

### 2.1 Company Module

- [ ] **Обновить** `src/api/db/company.functions.sql`
  - [ ] `company.create_company()`
    - [ ] Добавлен `rbac.set_user_context()` в начало
    - [ ] Проверка `rbac.has_permission(_user_id, NULL, 'company.create')`
  - [ ] `company.update_company()`
    - [ ] Добавлен `rbac.set_user_context()`
    - [ ] Проверка `rbac.has_permission(_user_id, _company_id, 'company.update')`
  - [ ] `company.invite_member()`
    - [ ] Проверка `rbac.has_permission(_user_id, _company_id, 'company.invite')`
  - [ ] `company.remove_member()`
    - [ ] Проверка `rbac.has_permission(_user_id, _company_id, 'company.remove_member')`
  - [ ] `company.update_member_role()`
    - [ ] Проверка `rbac.has_permission(_user_id, _company_id, 'company.change_roles')`

### 2.2 Task Module

- [ ] **Создать** `src/api/db/task.functions.sql` (если не существует)
  - [ ] `task.create_task()`
    - [ ] Context setting
    - [ ] Permission check: `task.create`
  - [ ] `task.update_task()`
    - [ ] Context setting
    - [ ] Permission check: `task.update`
  - [ ] `task.delete_task()`
    - [ ] Context setting
    - [ ] Permission check: `task.delete`
  - [ ] `task.assign_task()`
    - [ ] Context setting
    - [ ] Permission check: `task.assign`

### 2.3 OrgChart Module

- [ ] **Обновить** `src/api/db/orgchart.functions.sql`
  - [ ] Все функции используют `rbac.set_user_context()`
  - [ ] `orgchart.create_orgchart()` → проверка `orgchart.create`
  - [ ] `orgchart.update_orgchart()` → проверка `orgchart.update`
  - [ ] `orgchart.delete_orgchart()` → проверка `orgchart.delete`
  - [ ] `orgchart.approve_orgchart()` → проверка `orgchart.approve`
  - [ ] `orgchart.appoint_user()` → проверка `orgchart.appoint`

### 2.4 DoA Module

- [ ] **Создать** `src/api/db/doa.functions.sql`
  - [ ] `doa.create_matrix()`
    - [ ] Permission check: `doa.create`
  - [ ] `doa.update_matrix()`
    - [ ] Permission check: `doa.update`
  - [ ] `doa.delete_matrix()`
    - [ ] Permission check: `doa.delete`

### 2.5 Audit Module

- [ ] **Обновить** `src/api/db/audit.functions.sql`
  - [ ] `audit.get_audit_trail()` → проверка `audit.read`
  - [ ] `audit.generate_soc_report()` → проверка `audit.export`

---

## Phase 3: API Layer (Hono) ⏱️ 1-2 дня

### 3.1 Создать Middleware

- [ ] **Создать** `src/api/middleware/rbac-context.middleware.ts`
  ```typescript
  export const rbacContextMiddleware = async (c, next) => {
    const userId = c.get("userId"); // From auth middleware
    const companyId = c.req.header("X-Company-Id");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", userId);
    c.set("companyId", companyId);

    await next();
  };
  ```

### 3.2 Обновить Routes

- [ ] **Обновить** `src/api/routes/company.routes.ts`
  - [ ] Middleware применен
  - [ ] `user_id` и `company_id` передаются в функции

- [ ] **Обновить** `src/api/routes/task.routes.ts`
  - [ ] Middleware применен
  - [ ] Параметры правильно передаются

- [ ] **Обновить** `src/api/routes/orgchart.routes.ts`
  - [ ] Middleware применен

- [ ] **Создать** `src/api/routes/rbac.routes.ts`
  ```typescript
  // GET /api/rbac/permissions - List all permissions
  // GET /api/rbac/user-permissions - Get user's permissions
  // POST /api/rbac/grant - Grant permission
  // POST /api/rbac/revoke - Revoke permission
  ```

### 3.3 Обновить FUNCTION_PARAMS

- [ ] **Обновить** маппинг параметров для всех функций
  - [ ] Все функции имеют `user_id` как первый параметр
  - [ ] Все функции имеют `company_id` как второй параметр
  - [ ] Порядок параметров соответствует SQL функциям

---

## Phase 4: Client Services (TypeScript) ⏱️ 2-3 дня

### 4.1 Создать RBAC Service

- [ ] **Создать** `src/modules/shared/rbac.service.ts`
  ```typescript
  export class RBACService {
    static async hasPermission(permission: string): Promise<boolean>
    static async getUserPermissions(): Promise<UserPermissions>
    static async grantPermission(userId: string, permission: string): Promise<void>
    static async revokePermission(userId: string, permission: string): Promise<void>
    static async listPermissions(module?: string): Promise<Permission[]>
  }
  ```

### 4.2 Создать React Hooks

- [ ] **Создать** `src/modules/shared/hooks/usePermission.ts`
  ```typescript
  export function usePermission(permission: string): boolean
  export function usePermissions(): UserPermissions
  ```

### 4.3 Создать UI Components

- [ ] **Создать** `src/modules/shared/components/PermissionGuard.tsx`
  ```typescript
  export function PermissionGuard({
    permission,
    children,
    fallback
  }: PermissionGuardProps)
  ```

### 4.4 Обновить существующие Services

- [ ] **Обновить** `src/modules/company/company-service.ts`
  - [ ] Добавлены методы для работы с RBAC
  - [ ] Используется `RBACService.hasPermission()` перед API вызовами

- [ ] **Обновить** `src/modules/task/task.service.ts`
  - [ ] Проверки прав перед операциями

---

## Phase 5: UI Integration ⏱️ 2-3 дня

### 5.1 Создать Permissions Management Page

- [ ] **Создать** `src/modules/settings/permissions.page.tsx`
  - [ ] Список членов компании
  - [ ] Просмотр ролей и прав
  - [ ] Редактирование ролей
  - [ ] Выдача/отзыв конкретных прав
  - [ ] История изменений прав

### 5.2 Обновить Navigation

- [ ] **Обновить** sidebar/navigation
  - [ ] Добавлен пункт "Permissions" в настройках
  - [ ] Использован `<PermissionGuard permission="company.change_roles">`

### 5.3 Обновить существующие компоненты

- [ ] **Task Module**
  - [ ] Кнопка "Create Task" обернута в `<PermissionGuard permission="task.create">`
  - [ ] Кнопка "Delete Task" обернута в `<PermissionGuard permission="task.delete">`

- [ ] **Company Module**
  - [ ] Кнопка "Invite Member" → `company.invite`
  - [ ] Кнопка "Remove Member" → `company.remove_member`

- [ ] **OrgChart Module**
  - [ ] Кнопка "Create OrgChart" → `orgchart.create`
  - [ ] Кнопка "Approve" → `orgchart.approve`

- [ ] **DoA Module**
  - [ ] Кнопки защищены соответствующими правами

### 5.4 Обновить Routes

- [ ] **Обновить** `src/App.tsx` или router config
  ```typescript
  {
    path: "/settings/permissions",
    element: (
      <PermissionGuard permission="company.change_roles">
        <PermissionsPage />
      </PermissionGuard>
    )
  }
  ```

---

## Phase 6: i18n (Интернационализация) ⏱️ 1 день

### 6.1 Добавить переводы для RBAC

- [ ] **Обновить** `src/lib/locales/en/translation.json`
  ```json
  {
    "rbac": {
      "permissions": { ... },
      "roles": { ... },
      "actions": { ... }
    }
  }
  ```

- [ ] **Обновить** остальные языковые файлы
  - [ ] `zh/translation.json` (Китайский)
  - [ ] `es/translation.json` (Испанский)
  - [ ] `ar/translation.json` (Арабский)
  - [ ] `hi/translation.json` (Хинди)

### 6.2 Перевести Permission Descriptions

- [ ] Каждое право имеет описание на всех 5 языках
  - [ ] `task.create` → "Create new tasks" / "创建新任务" / etc.
  - [ ] `orgchart.approve` → "Approve org chart changes" / etc.

---

## Phase 7: Testing ⏱️ 2-3 дня

### 7.1 Unit Tests (SQL)

- [ ] **Тесты для** `rbac.has_permission()`
  - [ ] Базовая роль дает права
  - [ ] Custom role переопределяет базовую роль
  - [ ] Grant override дает дополнительные права
  - [ ] Revoke override убирает права
  - [ ] Временные права истекают

- [ ] **Тесты для** RLS policies
  - [ ] Пользователь видит только свои компании
  - [ ] Tenant isolation работает для всех таблиц
  - [ ] Superuser видит все

### 7.2 Integration Tests (API)

- [ ] **Тест:** Создание пользователя → Проверка прав
- [ ] **Тест:** Owner выдает права member → Member получает доступ
- [ ] **Тест:** Admin пытается выдать critical permission → Denied
- [ ] **Тест:** Temporary permission expires → Access revoked

### 7.3 E2E Tests (UI)

- [ ] **Тест:** Login → Кнопки скрыты/показаны в зависимости от прав
- [ ] **Тест:** Admin открывает Permissions page → Видит всех членов
- [ ] **Тест:** Member открывает Permissions page → 403 Forbidden
- [ ] **Тест:** Owner изменяет роль member → UI обновляется

---

## Phase 8: Documentation ⏱️ 1 день

### 8.1 Обновить архитектурные документы

- [ ] **Обновить** `ARCHITECTURE.md`
  - [ ] Добавлена секция про RBAC
  - [ ] Ссылка на `docs/RBAC_ARCHITECTURE.md`

- [ ] **Создать** `docs/RBAC_ARCHITECTURE.md`
  - [ ] Описание системы RBAC
  - [ ] Примеры использования
  - [ ] FAQ

- [ ] **Создать** `docs/RBAC_IMPLEMENTATION_CHECKLIST.md`
  - [ ] Пошаговый чеклист внедрения

### 8.2 Обновить README

- [ ] Упомянуть RBAC в features
- [ ] Добавить ссылки на документацию

### 8.3 Создать Developer Guide

- [ ] **Создать** `docs/RBAC_DEVELOPER_GUIDE.md`
  - [ ] Как добавить новое право
  - [ ] Как защитить SQL функцию
  - [ ] Как защитить UI компонент
  - [ ] Примеры кода

---

## Phase 9: Security Audit ⏱️ 1 день

### 9.1 Проверка безопасности

- [ ] Все SQL функции проверяют права
- [ ] RLS включен для всех multi-tenant таблиц
- [ ] Нет обхода проверки прав
- [ ] Audit logging работает для всех изменений прав
- [ ] Нет SQL injection уязвимостей
- [ ] Нет утечек данных между компаниями

### 9.2 Performance Testing

- [ ] RLS не замедляет запросы (EXPLAIN ANALYZE)
- [ ] Индексы созданы для всех foreign keys
- [ ] Permission caching работает на клиенте

---

## Phase 10: Deployment ⏱️ 1 день

### 10.1 Staging Environment

- [ ] Деплой RBAC на staging
- [ ] Smoke tests пройдены
- [ ] Audit logs работают

### 10.2 Production Deployment

- [ ] Backup базы данных
- [ ] Деплой SQL schema (rbac.definition.sql)
- [ ] Деплой SQL functions (rbac.functions.sql)
- [ ] Деплой RLS policies (rls.policies.sql)
- [ ] Деплой frontend (с RBAC UI)
- [ ] Проверка работоспособности
- [ ] Мониторинг ошибок

---

## 🎯 Quick Start: Минимальный MVP (1-2 дня)

Если нужно быстро внедрить базовый RBAC:

1. **Database:**
   - [ ] Запустить `rbac.definition.sql`
   - [ ] Запустить `rbac.functions.sql`
   - [ ] Включить RLS только для `tasks` и `companies`

2. **API:**
   - [ ] Создать `rbac.routes.ts` с базовыми endpoints

3. **Client:**
   - [ ] Создать `RBACService`
   - [ ] Создать `usePermission` hook
   - [ ] Обернуть 2-3 критичных кнопки в `<PermissionGuard>`

4. **Testing:**
   - [ ] Тест: Owner видит все → Member видит ограниченное

---

## 🔍 Troubleshooting

### Проблема: RLS блокирует все запросы

**Решение:**
```sql
-- Проверить текущий контекст
SELECT rbac.get_user_context();

-- Установить контекст
SELECT rbac.set_user_context('user_id', 'company_id'::UUID);
```

### Проблема: Permission denied при вызове функции

**Решение:**
1. Проверить, что пользователь член компании:
   ```sql
   SELECT * FROM user_companies WHERE user_id = 'user_id' AND company_id = 'company_id';
   ```

2. Проверить права пользователя:
   ```sql
   SELECT rbac.get_user_permissions('user_id', 'company_id');
   ```

3. Проверить, существует ли право:
   ```sql
   SELECT * FROM permissions WHERE name = 'permission_name';
   ```

### Проблема: Audit logging не работает

**Решение:**
- Проверить, что триггер `rbac.audit_user_permissions` создан
- Проверить, что audit schema существует

---

## 📊 Progress Tracking

Общий прогресс: `[____________________] 0%`

- [ ] Phase 1: Database Schema (0/4)
- [ ] Phase 2: SQL Functions (0/5)
- [ ] Phase 3: API Layer (0/3)
- [ ] Phase 4: Client Services (0/4)
- [ ] Phase 5: UI Integration (0/4)
- [ ] Phase 6: i18n (0/2)
- [ ] Phase 7: Testing (0/3)
- [ ] Phase 8: Documentation (0/3)
- [ ] Phase 9: Security Audit (0/2)
- [ ] Phase 10: Deployment (0/2)

---

## ✅ Sign-off

После завершения каждой фазы:

- [ ] Code review пройден
- [ ] Tests пройдены
- [ ] Documentation обновлена
- [ ] Approved by Tech Lead

---

**Удачи в внедрении RBAC! 🚀**

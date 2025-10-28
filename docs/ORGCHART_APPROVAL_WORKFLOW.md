# OrgChart Approval Workflow

Система согласования организационных структур для Ankey.

## Обзор

Approval workflow для организационных структур (orgcharts) реализует следующий процесс:

1. **Инициатор** отправляет orgchart на согласование → статус меняется на `pending_approval`
2. **Owner компании** получает задачу (task) на утверждение документа
3. **Инициатор** получает задачу со статусом "ожидает утверждения"
4. **Owner** может:
   - **Approve** - утвердить документ (комментарии опциональны)
   - **Decline** - отклонить документ (комментарии обязательны)
5. **Инициатор** получает уведомление о результате (approved или declined)
6. Все действия сохраняются для audit trail

## Архитектура

### Компоненты системы

```
src/modules/htr/orgchart/
├── orgchart-approval.service.ts       # Сервис согласования
├── orgchartList.page.tsx              # Список orgcharts с кнопкой "Submit for Approval"
├── orgchartView.page.tsx              # Просмотр orgchart с кнопкой "Submit for Approval"

src/modules/task/
├── tasks.page.tsx                     # Список всех задач (включая approval tasks)
├── taskDetail.page.tsx                # Детали обычных задач
└── orgchartApprovalTask.page.tsx      # Детали задач согласования orgchart

src/App.tsx
├── /task                              # Список задач
├── /task/:taskId                      # Детали обычной задачи
└── /task/orgchart/:taskId             # Детали задачи согласования orgchart
```

### Модели данных

#### ApprovalWorkflow

Workflow документ, хранящийся в `orgchartsDB`:

```typescript
interface ApprovalWorkflow {
  _id: string;                    // company:{companyId}:workflow_{orgChartId}_{timestamp}
  type: "approval_workflow";
  companyId: string;

  entityType: "orgchart";
  entityId: string;               // orgchart ID без префикса partition

  status: "pending" | "approved" | "declined";

  initiatorId: string;            // Пользователь, отправивший на согласование
  approverId: string;             // Owner компании (утверждающий)

  submittedAt: number;
  respondedAt?: number;
  comments?: string;              // Комментарии от утверждающего

  createdAt: number;
  updatedAt: number;
}
```

#### ApprovalTask

Task документ для пользователя, хранящийся в `orgchartsDB`:

```typescript
interface ApprovalTask {
  _id: string;                    // company:{companyId}:task_{type}_{workflowId}
  type: "task";
  companyId: string;

  taskType: "approval_pending" | "approval_response";
  userId: string;                 // Кому назначена задача

  workflowId: string;
  entityType: "orgchart";
  entityId: string;

  completed: boolean;
  completedAt?: number;

  title: string;
  description: string;
  priority: "low" | "medium" | "high";

  createdAt: number;
  updatedAt: number;
}
```

## Workflow процесс

### 1. Отправка на согласование (Submit for Approval)

**Действие:** Пользователь нажимает "Send for Approval" / "Submit for Approval"

**Код:**
```typescript
// В orgchartList.page.tsx или orgchartView.page.tsx
const { OrgChartApprovalService } = await import("./orgchart-approval.service");
await OrgChartApprovalService.submitForApproval(
  companyId,
  orgChartId,
  initiatorUserId
);
```

**Что происходит:**

1. Проверяется, что orgchart в статусе `draft`
2. Определяется owner компании (первый пользователь с ролью `owner`)
3. Создается `ApprovalWorkflow` документ со статусом `pending`
4. Создаются 2 задачи:
   - **Для инициатора**: "Org Chart Approval Pending" (уведомление о том, что документ на согласовании)
   - **Для owner**: "Approve Org Chart" (задача на утверждение)
5. OrgChart меняет статус на `pending_approval`
6. Сохраняется информация: `submittedForApprovalAt`, `submittedForApprovalBy`

**Результат:**
- OrgChart status: `draft` → `pending_approval`
- 2 задачи в базе данных
- Пользователи видят задачи на странице `/task`

### 2. Утверждение (Approve)

**Действие:** Owner компании утверждает документ

**Код:**
```typescript
await OrgChartApprovalService.approveOrgChart(
  companyId,
  workflowId,
  approverUserId,
  comments  // Опциональные комментарии
);
```

**Что происходит:**

1. Проверяется, что пользователь - это `approverId` из workflow
2. Workflow меняет статус: `pending` → `approved`
3. OrgChart меняет статус: `pending_approval` → `approved`
4. Устанавливается `enforcedAt` (дата вступления в силу)
5. Все другие `approved` orgcharts для компании меняют статус на `revoked`
6. Задача owner помечается как `completed`
7. Задача инициатора обновляется:
   - Тип: `approval_response`
   - Title: "Org Chart Approved"
   - Description: включает комментарии (если есть)
   - Статус: `completed = false` (требует подтверждения)

**Результат:**
- OrgChart status: `pending_approval` → `approved`
- Workflow status: `pending` → `approved`
- Предыдущие approved orgcharts: `approved` → `revoked`
- Инициатор получает уведомление об утверждении

### 3. Отклонение (Decline)

**Действие:** Owner компании отклоняет документ

**Код:**
```typescript
await OrgChartApprovalService.declineOrgChart(
  companyId,
  workflowId,
  approverUserId,
  comments  // Обязательные комментарии
);
```

**Что происходит:**

1. Проверяется наличие комментариев (обязательны)
2. Проверяется, что пользователь - это `approverId` из workflow
3. Workflow меняет статус: `pending` → `declined`
4. OrgChart возвращается в статус: `pending_approval` → `draft`
5. Задача owner помечается как `completed`
6. Задача инициатора обновляется:
   - Тип: `approval_response`
   - Title: "Org Chart Declined"
   - Description: включает комментарии с причиной отклонения
   - Priority: `high`
   - Статус: `completed = false` (требует подтверждения)

**Результат:**
- OrgChart status: `pending_approval` → `draft` (можно отредактировать и отправить снова)
- Workflow status: `pending` → `declined`
- Инициатор получает уведомление об отклонении с комментариями

### 4. Подтверждение результата (Acknowledge)

**Действие:** Инициатор подтверждает, что увидел результат

**Код:**
```typescript
await OrgChartApprovalService.completeTask(companyId, taskId);
```

**Что происходит:**

1. Задача помечается как `completed = true`
2. Устанавливается `completedAt`

**Результат:**
- Задача исчезает из списка pending tasks

## Интеграция с Tasks Module

### Загрузка задач

В `tasks.page.tsx` задачи загружаются из двух источников:

1. **API tasks** (через backend)
2. **OrgChart approval tasks** (из PouchDB)

```typescript
// Load orgchart approval tasks from PouchDB
const orgchartTasks = await OrgChartApprovalService.getUserTasks(
  activeCompany._id,
  user._id
);

// Convert to Task format
const convertedOrgchartTasks: Task[] = orgchartTasks.map((task) => ({
  id: task._id,
  type: "approval",
  entityType: "orgchart",
  entityId: task.entityId,
  // ...
}));

// Merge with API tasks
const allTasks = [...apiTasks, ...convertedOrgchartTasks];
```

### Навигация

При клике на задачу с `entityType === "orgchart"`:

```typescript
// В tasks.page.tsx
onRowClick={(task) => {
  if (task.entityType === "orgchart") {
    const taskId = task.id.split(":").pop() || task.id;
    setLocation(`/task/orgchart/${taskId}`);
  }
}}
```

Открывается специальная страница `orgchartApprovalTask.page.tsx` с:
- Информацией о задаче
- Деталями OrgChart
- Таймлайном workflow
- Действиями (Approve/Decline/Acknowledge)

## Audit Trail

Все действия сохраняются для аудита:

### Workflow документ
- `submittedAt` - когда отправлено
- `respondedAt` - когда был ответ
- `comments` - комментарии
- `status` - текущий статус

### OrgChart документ
- `submittedForApprovalAt` - когда отправлено
- `submittedForApprovalBy` - кто отправил
- `approvedAt` - когда утверждено
- `approvedBy` - кто утвердил
- `enforcedAt` - дата вступления в силу
- `revokedAt` - дата отзыва (для старых версий)

### Task документы
- Полная история создания и завершения задач
- Все задачи остаются в базе даже после завершения

## API Reference

### OrgChartApprovalService

#### `submitForApproval(companyId, orgChartId, initiatorId)`

Отправляет orgchart на согласование.

**Параметры:**
- `companyId` - ID компании
- `orgChartId` - ID orgchart (без partition prefix)
- `initiatorId` - ID пользователя-инициатора

**Возвращает:**
```typescript
{
  workflow: ApprovalWorkflow;
  tasks: ApprovalTask[];
}
```

**Исключения:**
- "OrgChart not found"
- "Only draft orgcharts can be submitted for approval"
- "Company owner not found"

#### `approveOrgChart(companyId, workflowId, approverId, comments?)`

Утверждает orgchart.

**Параметры:**
- `companyId` - ID компании
- `workflowId` - ID workflow (без partition prefix)
- `approverId` - ID пользователя-утверждающего
- `comments` - Опциональные комментарии

**Исключения:**
- "Workflow not found"
- "Workflow is not pending approval"
- "You are not authorized to approve this workflow"

#### `declineOrgChart(companyId, workflowId, approverId, comments)`

Отклоняет orgchart.

**Параметры:**
- `companyId` - ID компании
- `workflowId` - ID workflow (без partition prefix)
- `approverId` - ID пользователя-утверждающего
- `comments` - **Обязательные** комментарии с причиной

**Исключения:**
- "Comments are required when declining"
- "Workflow not found"
- "Workflow is not pending approval"
- "You are not authorized to decline this workflow"

#### `getUserTasks(companyId, userId)`

Получает все незавершенные задачи пользователя.

**Возвращает:**
```typescript
ApprovalTask[]
```

#### `completeTask(companyId, taskId)`

Помечает задачу как завершенную (для acknowledgement).

## Пользовательские сценарии

### Сценарий 1: Успешное утверждение

1. HR Manager создает новую организационную структуру
2. HR Manager нажимает "Submit for Approval"
3. CEO получает задачу "Approve Org Chart - HR Structure 2024"
4. CEO открывает задачу, просматривает детали
5. CEO нажимает "Approve" (с опциональными комментариями)
6. HR Manager получает уведомление "Org Chart Approved"
7. HR Manager нажимает "Acknowledge"
8. Организационная структура вступает в силу

### Сценарий 2: Отклонение с доработкой

1. HR Manager создает организационную структуру
2. HR Manager нажимает "Submit for Approval"
3. CEO получает задачу на утверждение
4. CEO находит ошибки, нажимает "Decline"
5. CEO вводит комментарии: "Не хватает должности CFO в Finance департаменте"
6. HR Manager получает уведомление "Org Chart Declined" с комментариями
7. HR Manager нажимает "Acknowledge"
8. HR Manager открывает orgchart, вносит изменения
9. HR Manager снова отправляет на согласование
10. Процесс повторяется

### Сценарий 3: Смена версий

1. Компания использует OrgChart v1.0 (status: `approved`)
2. HR Manager создает OrgChart v2.0 (status: `draft`)
3. HR Manager отправляет v2.0 на согласование
4. CEO утверждает v2.0
5. **Автоматически:** v1.0 меняет статус на `revoked`
6. v2.0 становится активной версией

## Настройка

### Определение Owner компании

Система автоматически определяет owner как:
1. Первого пользователя с ролью `owner` в таблице `user_companies`
2. Если нет owner, берется первый пользователь компании (по `createdAt`)

```typescript
// В orgchart-approval.service.ts
private static async getCompanyOwner(companyId: string): Promise<string | null> {
  const result = await userCompaniesDB.find({
    selector: {
      companyId,
      role: "owner",
      type: "user_company"
    },
    limit: 1
  });

  // Fallback to first user if no owner
  if (result.docs.length === 0) {
    const fallbackResult = await userCompaniesDB.find({
      selector: { companyId, type: "user_company" },
      limit: 1,
      sort: [{ createdAt: "asc" }]
    });
    return fallbackResult.docs[0]?.userId || null;
  }

  return result.docs[0].userId;
}
```

## Ограничения и будущие улучшения

### Текущие ограничения

1. **Один утверждающий** - только owner компании может утверждать
2. **Без делегирования** - owner не может делегировать утверждение другому пользователю
3. **Без multi-level approval** - нет многоуровневого согласования
4. **Без уведомлений по email** - уведомления только в UI

### Планируемые улучшения

- [ ] Email уведомления для инициатора и owner
- [ ] Интеграция с существующей DOA (Delegation of Authority) системой
- [ ] Multi-level approval (CEO → CFO → HR)
- [ ] Делегирование утверждения
- [ ] Автоматическое утверждение для определенных типов изменений
- [ ] Напоминания о просроченных задачах
- [ ] История изменений (diff) между версиями orgchart

## Troubleshooting

### Проблема: Owner не получает задачу

**Причина:** Owner не найден в системе

**Решение:**
1. Проверьте таблицу `user_companies`
2. Убедитесь, что хотя бы один пользователь связан с компанией
3. Проверьте роли пользователей (`role: "owner"`)

### Проблема: Нельзя отправить orgchart на согласование

**Причина:** OrgChart не в статусе `draft`

**Решение:**
1. Проверьте статус orgchart
2. Если статус `pending_approval` - дождитесь ответа от owner
3. Если статус `approved` - создайте новую версию

### Проблема: Задачи не появляются в списке

**Причина:** Задачи не загружаются из PouchDB

**Решение:**
1. Проверьте, что `activeCompany` установлена
2. Проверьте логи консоли на ошибки
3. Убедитесь, что синхронизация с CouchDB работает

## Testing

### Manual Testing Checklist

- [ ] Создать draft orgchart
- [ ] Отправить на согласование (Submit for Approval)
- [ ] Проверить, что owner получил задачу
- [ ] Проверить, что инициатор получил задачу "pending approval"
- [ ] Утвердить как owner (с комментариями)
- [ ] Проверить, что инициатор получил уведомление об утверждении
- [ ] Подтвердить уведомление (Acknowledge)
- [ ] Проверить, что задачи завершены
- [ ] Создать еще один draft orgchart
- [ ] Отправить на согласование
- [ ] Отклонить как owner (с обязательными комментариями)
- [ ] Проверить, что инициатор получил уведомление об отклонении
- [ ] Проверить, что orgchart вернулся в статус `draft`
- [ ] Проверить audit trail (workflow и orgchart документы)

## См. также

- [ORGCHART.md](./ORGCHART.md) - Документация по модулю OrgChart
- [MULTITENANCY.md](./MULTITENANCY.md) - Мультитенантность и партиционирование
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Общая архитектура приложения

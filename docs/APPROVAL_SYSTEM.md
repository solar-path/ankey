# Unified Document Approval System

## Overview

Единая система утверждения документов для всех типов документов в приложении, использующая DOA (Delegation of Authority) матрицы для определения процесса утверждения.

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│ DocumentApprovalService (универсальный)                 │
│ - submitForApproval(documentType, documentId)          │
│ - approve/decline(workflowId)                          │
│ - использует DOAService.getActiveMatrixForType()      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ ApprovalMatrix (DOA матрица)                            │
│ - documentType: "department_charter" | "job_desc" ...  │
│ - approvalBlocks: [{ level, approvers[], ... }]       │
│ - status: "active"                                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ ApprovalWorkflow                                        │
│ - entityType: "department_charter" | "orgchart" ...    │
│ - currentLevel: 1, 2, 3...                            │
│ - decisions: [{ userId, level, decision, timestamp }] │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ ApprovalTask (универсальная страница)                   │
│ - Показывает любой тип документа                       │
│ - Рендерит preview для каждого типа документа         │
└─────────────────────────────────────────────────────────┘
```

## Типы документов

Система поддерживает следующие типы документов:

- `department_charter` - Department Charter
- `job_description` - Job Description
- `job_offer` - Job Offer
- `employment_contract` - Employment Contract
- `termination_notice` - Termination Notice
- `orgchart` - Organizational Chart

## Ключевые компоненты

### 1. DocumentApprovalService

**Файл:** `src/modules/shared/services/document-approval.service.ts`

Универсальный сервис для управления процессом утверждения любого типа документа.

**Основные методы:**

- `submitForApproval(companyId, document, initiatorId)` - Отправить документ на утверждение
- `approve(companyId, workflowId, userId, comments?)` - Утвердить документ на текущем уровне
- `decline(companyId, workflowId, userId, comments)` - Отклонить документ
- `getWorkflowForDocument(companyId, documentType, documentId)` - Получить workflow для документа
- `getUserTasks(companyId, userId)` - Получить задачи пользователя
- `completeTask(companyId, taskId)` - Отметить задачу как выполненную

### 2. ApprovalTask Page

**Файл:** `src/modules/task/approvalTask.page.tsx`

Универсальная страница для отображения и обработки задач утверждения всех типов документов.

**Роут:** `/task/approval/:taskId`

**Возможности:**
- Отображение деталей workflow
- История утверждений
- Действия: Approve/Decline (для approval_request)
- Acknowledge (для approval_response)

### 3. DOA Matrices

**Сервис:** `src/modules/doa/doa.service.ts`

Управление матрицами утверждения (approval matrices).

**Ключевые методы:**
- `getMatrices(companyId)` - Получить все матрицы компании
- `getActiveMatrixForType(companyId, documentType)` - Получить активную матрицу для типа документа
- `createMatrix(companyId, data, userId)` - Создать новую матрицу

### 4. Типы данных

**Файл:** `src/modules/shared/database/db.ts`

```typescript
// Тип документа
export type DocumentType =
  | "department_charter"
  | "job_description"
  | "job_offer"
  | "employment_contract"
  | "termination_notice"
  | "orgchart";

// Блок утверждения (уровень в матрице)
export interface ApprovalBlock {
  level: number;
  approvers: string[]; // User IDs
  requiresAll: boolean; // Требуется ли утверждение всех
  minApprovals?: number; // Минимум утверждений (если requiresAll = false)
}

// Матрица утверждения
export interface ApprovalMatrix {
  _id: string;
  type: "approval_matrix";
  companyId: string;
  name: string;
  documentType: DocumentType;
  status: "active" | "inactive" | "draft";
  approvalBlocks: ApprovalBlock[];
  // ...
}

// Решение по утверждению
export interface ApprovalDecision {
  userId: string;
  level: number;
  decision: "approved" | "declined";
  comments?: string;
  timestamp: number;
}

// Workflow утверждения
export interface ApprovalWorkflow {
  _id: string;
  type: "approval_workflow";
  companyId: string;
  entityType: DocumentType;
  entityId: string;
  status: "pending" | "approved" | "declined";
  currentLevel: number;
  matrixId: string;
  initiatorId: string;
  decisions: ApprovalDecision[];
  // ...
}

// Задача утверждения
export interface ApprovalTask {
  _id: string;
  type: "task";
  companyId: string;
  taskType: "approval_request" | "approval_response";
  userId: string;
  workflowId: string;
  entityType: DocumentType;
  entityId: string;
  completed: boolean;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  // ...
}
```

## Создание компании

При создании новой workspace-компании автоматически создаются дефолтные DOA матрицы для всех типов документов.

**Файл:** `src/modules/company/company-service.ts`

**Метод:** `createDefaultDOAMatrices(companyId, ownerId)`

Для каждого типа документа создается матрица с:
- Одним уровнем утверждения (level 1)
- Одним approver'ом - первым пользователем компании (owner)
- Статус: "active"

## Процесс утверждения

### 1. Отправка документа на утверждение

```typescript
import { DocumentApprovalService } from "@/modules/shared/services/document-approval.service";

const { workflow, tasks } = await DocumentApprovalService.submitForApproval(
  companyId,
  {
    id: "orgchart_123",
    type: "orgchart",
    title: "Q1 2024 Org Chart",
    version: 1,
  },
  currentUserId
);
```

**Что происходит:**
1. Система ищет активную DOA матрицу для типа документа
2. Если матрицы нет - создается дефолтная с owner'ом
3. Создается ApprovalWorkflow с текущим уровнем = 1
4. Создаются задачи (ApprovalTask) для:
   - Инициатора (approval_response - статус "pending")
   - Всех approver'ов первого уровня (approval_request - требует действия)

### 2. Утверждение документа

```typescript
const { workflow, nextLevelTasks } = await DocumentApprovalService.approve(
  companyId,
  workflowId,
  userId,
  "Looks good!"
);
```

**Что происходит:**
1. Проверяется, что пользователь - approver на текущем уровне
2. Добавляется ApprovalDecision
3. Проверяется, завершен ли текущий уровень:
   - Если `requiresAll: true` - нужны утверждения всех approvers
   - Если `requiresAll: false` - нужно `minApprovals` утверждений
4. Если уровень завершен:
   - Если есть следующий уровень - переход на него, создаются новые задачи
   - Если уровней нет - workflow завершен со статусом "approved"

### 3. Отклонение документа

```typescript
const workflow = await DocumentApprovalService.decline(
  companyId,
  workflowId,
  userId,
  "Needs revision - please update salary section"
);
```

**Что происходит:**
1. Workflow получает статус "declined"
2. Все задачи текущего уровня завершаются
3. Задача инициатора обновляется с комментариями

## Multi-level Approval

Система поддерживает многоуровневое утверждение:

```typescript
const matrix = await DOAService.createMatrix(companyId, {
  name: "Executive Approval",
  documentType: "employment_contract",
  status: "active",
  approvalBlocks: [
    {
      level: 1,
      approvers: [hrManagerId],
      requiresAll: true,
    },
    {
      level: 2,
      approvers: [cfoId, ceoId],
      requiresAll: false,
      minApprovals: 1, // Достаточно одного из CFO или CEO
    },
    {
      level: 3,
      approvers: [boardMemberId1, boardMemberId2, boardMemberId3],
      requiresAll: false,
      minApprovals: 2, // Нужны 2 из 3 членов совета
    },
  ],
}, creatorId);
```

## Миграция существующего кода

### OrgChart Approval

Старый сервис: `src/modules/htr/orgchart/orgchart-approval.service.ts` (deprecated)

Для миграции OrgChart на новую систему:

1. Заменить вызовы `OrgChartApprovalService` на `DocumentApprovalService`
2. Обновить роуты задач с `/task/orgchart/:taskId` на `/task/approval/:taskId`
3. Использовать `DocumentType = "orgchart"`

## Примеры использования

### Получить задачи пользователя

```typescript
import { DocumentApprovalService } from "@/modules/shared/services/document-approval.service";

const tasks = await DocumentApprovalService.getUserTasks(companyId, userId);

// Фильтрация по типу
const approvalRequests = tasks.filter(t => t.taskType === "approval_request");
const notifications = tasks.filter(t => t.taskType === "approval_response");
```

### Проверить статус документа

```typescript
const workflow = await DocumentApprovalService.getWorkflowForDocument(
  companyId,
  "job_offer",
  jobOfferId
);

if (workflow) {
  console.log(`Status: ${workflow.status}`);
  console.log(`Current level: ${workflow.currentLevel}`);
  console.log(`Decisions: ${workflow.decisions.length}`);
}
```

### Создать кастомную DOA матрицу

```typescript
import { DOAService } from "@/modules/doa/doa.service";

const matrix = await DOAService.createMatrix(companyId, {
  name: "Standard Job Offer Approval",
  description: "HR Manager → Department Head → CFO",
  documentType: "job_offer",
  status: "active",
  approvalBlocks: [
    { level: 1, approvers: [hrManagerId], requiresAll: true },
    { level: 2, approvers: [deptHeadId], requiresAll: true },
    { level: 3, approvers: [cfoId], requiresAll: true },
  ],
}, currentUserId);
```

## UI/UX

### Tasks Page

**Роут:** `/tasks`

Отображает все задачи пользователя, включая:
- Approval requests (требуют действия)
- Approval responses (уведомления)
- Manual tasks (созданные вручную)

### Approval Task Page

**Роут:** `/task/approval/:taskId`

Универсальная страница для всех типов документов:
- Детали workflow
- История утверждений с комментариями
- Preview документа
- Действия: Approve/Decline/Acknowledge

### DOA Management

**Роуты:**
- `/doa` - Список всех DOA матриц
- `/doa/:id` - Просмотр/редактирование матрицы
- `/doa/matrix/:id` - Форма создания/редактирования матрицы

## Преимущества новой системы

1. **Универсальность** - один сервис для всех типов документов
2. **Гибкость** - multi-level approval с кастомными правилами
3. **Масштабируемость** - легко добавить новые типы документов
4. **Централизация** - вся логика утверждения в одном месте
5. **Автоматизация** - дефолтные матрицы при создании компании
6. **Прозрачность** - полная история решений с комментариями

## Следующие шаги

- [ ] Мигрировать OrgChart на новую систему
- [ ] Реализовать формы для других типов документов
- [ ] Добавить email уведомления для approval tasks
- [ ] Реализовать drag-and-drop редактор для DOA матриц (требует @dnd-kit)
- [ ] Добавить условные правила (amount-based routing)

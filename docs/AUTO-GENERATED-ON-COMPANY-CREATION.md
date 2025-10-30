# Автоматическое создание данных при создании компании

При создании новой компании (workspace) автоматически создаются DoA approval matrices и review tasks.

## Что создаётся автоматически

### 1. DoA Approval Matrices (6 типов)

Функция `doa.initialize_default_matrices()` создаёт approval matrices для:

| Document Type | Name | Description |
|---------------|------|-------------|
| `department_charter` | Default Department Charter Approval | Approval matrix for department charters |
| `job_description` | Default Job Description Approval | Approval matrix for job descriptions |
| `job_offer` | Default Job Offer Approval | Approval matrix for job offers |
| `employment_contract` | Default Employment Contract Approval | Approval matrix for employment contracts |
| `termination_notice` | Default Termination Notice Approval | Approval matrix for termination notices |
| `orgchart` | Default Orgchart Approval | Approval matrix for organizational charts |

**Параметры по умолчанию:**
- **Status:** `active`
- **Is Active:** `true`
- **Currency:** `USD`
- **Approval Blocks:** 1 уровень, требует подтверждения от owner
  ```json
  [
    {
      "level": 1,
      "order": 1,
      "approvers": ["user_id_owner"],
      "requiresAll": true,
      "minApprovals": 1
    }
  ]
  ```

### 2. Review Tasks (6 задач)

Функция `task.initialize_review_tasks()` создаёт задачи для owner:

| Task Title | Type | Priority | Deadline | Entity Type |
|------------|------|----------|----------|-------------|
| Review DoA Matrix: Department Charter | `review_doa_matrix` | `high` | NOW + 30 days | `approval_matrix` |
| Review DoA Matrix: Job Description | `review_doa_matrix` | `high` | NOW + 30 days | `approval_matrix` |
| Review DoA Matrix: Job Offer | `review_doa_matrix` | `high` | NOW + 30 days | `approval_matrix` |
| Review DoA Matrix: Employment Contract | `review_doa_matrix` | `high` | NOW + 30 days | `approval_matrix` |
| Review DoA Matrix: Termination Notice | `review_doa_matrix` | `high` | NOW + 30 days | `approval_matrix` |
| Review DoA Matrix: Organizational Chart | `review_doa_matrix` | `high` | NOW + 30 days | `approval_matrix` |

**Параметры задач:**
- **Assignees:** Owner (создатель компании)
- **Priority:** `high`
- **Deadline:** 30 дней с момента создания
- **Completed:** `false`
- **Description:** "Please review and approve the Delegation of Authority matrix for {Document Type}. This defines who needs to approve {document type} documents in your organization."
- **Metadata:**
  ```json
  {
    "documentType": "job_offer",
    "matrixId": "uuid-of-matrix"
  }
  ```

## Как это работает

### PostgreSQL Functions

Всё происходит в SQL функции `company.create_company()`:

```sql
-- File: src/api/db/company.functions.sql

CREATE OR REPLACE FUNCTION company.create_company(...)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id UUID;
  v_company_text_id TEXT;
  v_doa_result JSONB;
  v_tasks_result JSONB;
BEGIN
  -- 1. Create company
  INSERT INTO companies (...) VALUES (...);

  -- 2. Create user_company association (if workspace)
  IF _type = 'workspace' THEN
    INSERT INTO user_companies (...) VALUES (...);

    -- 3. Initialize default DoA matrices
    v_doa_result := doa.initialize_default_matrices(v_company_id, _user_id);

    -- 4. Initialize review tasks
    v_tasks_result := task.initialize_review_tasks(v_company_id, _user_id);
  END IF;

  RETURN jsonb_build_object(...);
END;
$$;
```

### Порядок выполнения

1. **Company Creation** → `company.create_company()`
2. **DoA Matrices** → `doa.initialize_default_matrices()`
   - Создаёт 6 approval matrices
   - По одной для каждого типа документа
   - С owner как единственным approver
3. **Review Tasks** → `task.initialize_review_tasks()`
   - Для каждой созданной matrix
   - Создаёт задачу на review
   - Assignee: owner
   - Deadline: 30 дней

### Error Handling

Обе функции обёрнуты в `BEGIN...EXCEPTION`:

```sql
BEGIN
  v_doa_result := doa.initialize_default_matrices(v_company_id, _user_id);
  RAISE NOTICE 'DoA matrices initialized: %', v_doa_result;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to initialize DoA matrices: %', SQLERRM;
END;
```

Это означает:
- ✅ Компания создастся даже если DoA/Tasks не создались
- ⚠️ Ошибки логируются как WARNING
- 📝 Успех логируется как NOTICE

## Проверка созданных данных

### SQL Queries

```sql
-- Проверить DoA matrices
SELECT document_type, name, status, is_active
FROM approval_matrices
WHERE company_id = 'your-company-uuid'
ORDER BY document_type;

-- Проверить review tasks
SELECT title, task_type, priority, completed, deadline
FROM tasks
WHERE company_id = 'your-company-uuid'
  AND task_type = 'review_doa_matrix'
ORDER BY title;

-- Проверить approval blocks
SELECT document_type, approval_blocks
FROM approval_matrices
WHERE company_id = 'your-company-uuid'
  AND document_type = 'job_offer';
```

### Expected Results

После создания компании должны быть:
- ✅ 6 approval matrices (status: active, is_active: true)
- ✅ 6 review tasks (priority: high, completed: false, deadline: +30 days)
- ✅ Все matrices имеют owner в approval_blocks
- ✅ Все tasks assigned to owner

## Customization

### Изменить типы документов

Отредактируйте массивы в обеих функциях:

**doa.functions.sql:**
```sql
v_document_types TEXT[] := ARRAY[
  'department_charter',
  'job_description',
  'job_offer',
  'employment_contract',
  'termination_notice',
  'orgchart',
  'new_document_type'  -- Добавить новый тип
];
```

**task.functions.sql:**
```sql
v_document_types TEXT[] := ARRAY[
  'department_charter',
  'job_description',
  'job_offer',
  'employment_contract',
  'termination_notice',
  'orgchart',
  'new_document_type'  -- Добавить новый тип
];
v_document_names TEXT[] := ARRAY[
  'Department Charter',
  'Job Description',
  'Job Offer',
  'Employment Contract',
  'Termination Notice',
  'Organizational Chart',
  'New Document Type'  -- Добавить display name
];
```

### Изменить approval structure

В `doa.initialize_default_matrices()` измените `approval_blocks`:

```sql
approval_blocks, jsonb_build_array(
  jsonb_build_object(
    'level', 1,
    'order', 1,
    'approvers', jsonb_build_array(_owner_user_id),
    'requiresAll', true,
    'minApprovals', 1
  ),
  -- Добавить второй уровень approval:
  jsonb_build_object(
    'level', 2,
    'order', 1,
    'approvers', jsonb_build_array('ceo_user_id', 'cfo_user_id'),
    'requiresAll', false,
    'minApprovals', 1
  )
),
```

### Изменить deadline для tasks

В `task.initialize_review_tasks()` измените:

```sql
deadline, NOW() + INTERVAL '30 days', -- Изменить на '7 days', '60 days', etc.
```

### Изменить priority

```sql
priority, 'high',  -- Изменить на 'medium', 'low', 'critical'
```

## Architecture Notes

Согласно [ARCHITECTURE.md](../ARCHITECTURE.md):
- ✅ **PostgreSQL-first:** Вся бизнес-логика в SQL функциях
- ✅ **Atomic operations:** Всё в одной транзакции
- ✅ **Error resilience:** Graceful error handling с EXCEPTION blocks
- ✅ **Audit logging:** Используется audit.log_action() для отслеживания
- ✅ **Row Level Security:** Работает через company_id

## Files

- **DoA Functions:** [src/api/db/doa.functions.sql](../src/api/db/doa.functions.sql) - `doa.initialize_default_matrices()`
- **Task Functions:** [src/api/db/task.functions.sql](../src/api/db/task.functions.sql) - `task.initialize_review_tasks()`
- **Company Functions:** [src/api/db/company.functions.sql](../src/api/db/company.functions.sql) - `company.create_company()`

## Testing

```bash
# Создать тестовую компанию
psql -U postgres -d ankey -c "
SELECT company.create_company(
  'user_1761660791_f9356b64-3579-479f-b99f-6575655b9a7f',
  'workspace',
  'Test Company'
);
"

# Проверить что DoA matrices созданы
psql -U postgres -d ankey -c "
SELECT COUNT(*) as matrix_count
FROM approval_matrices
WHERE company_id = (SELECT id FROM companies WHERE title = 'Test Company');
"
# Ожидается: 6

# Проверить что tasks созданы
psql -U postgres -d ankey -c "
SELECT COUNT(*) as task_count
FROM tasks
WHERE company_id = (SELECT id FROM companies WHERE title = 'Test Company')
  AND task_type = 'review_doa_matrix';
"
# Ожидается: 6
```

## Production Considerations

1. **Performance:** Создание компании вызывает 13+ INSERT операций (1 company + 1 user_company + 6 matrices + 6 tasks). Всё в одной транзакции, быстро.

2. **Scalability:** При большом количестве компаний рассмотрите:
   - Батчинг для массового создания
   - Async job queue для non-critical tasks

3. **Monitoring:** Логируйте NOTICE/WARNING из PostgreSQL:
   ```javascript
   client.on('notice', (msg) => {
     console.log('PostgreSQL Notice:', msg);
   });
   ```

4. **Audit Trail:** Все изменения логируются в `audit_log` таблицу через триггеры.

## Summary

✅ **6 DoA Approval Matrices** автоматически созданы при создании workspace компании
✅ **6 Review Tasks** автоматически созданы для owner с deadline 30 дней
✅ **Owner** является единственным approver по умолчанию
✅ **High priority** задачи требуют внимания owner
✅ **Graceful error handling** - компания создастся даже при ошибках в DoA/Tasks
✅ **PostgreSQL-first architecture** - вся логика в SQL функциях

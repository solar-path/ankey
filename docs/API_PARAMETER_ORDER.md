# API Parameter Order Requirements

## Проблема

PostgreSQL функции требуют параметры в **строгом порядке**. JavaScript `Object.values()` **не гарантирует** порядок свойств объекта, что приводит к передаче параметров в неправильном порядке.

### Пример проблемы

```typescript
// ❌ НЕПРАВИЛЬНО: Object.values() не гарантирует порядок
const body = { type: "workspace", user_id: "user123", title: "Company" };
const params = Object.values(body); // Может быть: ["workspace", "user123", "Company"]
                                     // Или: ["user123", "workspace", "Company"]
```

PostgreSQL функция ожидает: `(user_id, type, title)`, но получает параметры в случайном порядке.

## Решение

Используем **явный маппинг** параметров для каждой функции.

### Реализация

**Файл:** `src/api/routes/auth.routes.ts`

```typescript
/**
 * Parameter order mapping for PostgreSQL functions
 * CRITICAL: PostgreSQL functions require parameters in exact order
 */
const FUNCTION_PARAMS: Record<string, string[]> = {
  "company.create_company": [
    "user_id",    // 1. Кто создает
    "type",       // 2. Тип компании
    "title",      // 3. Название
    "logo",       // 4. Логотип (optional)
    "website",    // 5. Сайт (optional)
    "business_id",// 6. Бизнес ID (optional)
    "tax_id",     // 7. Налоговый ID (optional)
    "residence",  // 8. Страна регистрации (optional)
    "industry",   // 9. Отрасль (optional)
    "contact",    // 10. Контакты (optional)
  ],
};

// Извлечение параметров в правильном порядке
const paramOrder = FUNCTION_PARAMS[functionName];
const params = paramOrder.map((paramName) => body[paramName]);
```

## Правила

### 1. Добавление новой функции

При добавлении новой PostgreSQL функции:

1. **Проверьте сигнатуру** функции в PostgreSQL:
   ```sql
   \df+ company.create_company
   ```

2. **Добавьте маппинг** в `FUNCTION_PARAMS`:
   ```typescript
   "module.function_name": ["param1", "param2", "param3"],
   ```

3. **Порядок должен совпадать** с порядком параметров в `CREATE FUNCTION`.

### 2. Проверка порядка параметров

```bash
# Получить сигнатуру функции
psql -d ankey -c "\df+ company.create_company"

# Результат:
# Argument data types: _user_id text, _type text, _title text, ...
```

**Порядок в маппинге должен совпадать с порядком в Argument data types!**

### 3. Optional параметры

Параметры с `DEFAULT` значениями можно не передавать, но если передаются, они **должны быть в правильном порядке**:

```typescript
// ✅ ПРАВИЛЬНО: null для optional параметра в правильной позиции
{
  user_id: "user123",
  type: "workspace",
  title: "Company",
  logo: null,        // Позиция 4
  website: null,     // Позиция 5
  residence: "US"    // Позиция 8
}
```

## Полный список функций с маппингом

### Auth Module (17 функций)

```typescript
"auth.signup": ["email", "password", "fullname"]
"auth.signin": ["email", "password"]
"auth.signout": ["token"]
"auth.verify_account": ["code"]
"auth.verify_session": ["token"]
"auth.verify_2fa": ["email", "token"]
"auth.setup_2fa": ["user_id"]
"auth.enable_2fa": ["user_id", "token"]
"auth.disable_2fa": ["user_id", "token"]
"auth.get_2fa_status": ["user_id"]
"auth.update_profile": ["user_id", "fullname", "dob", "gender", "avatar", "phone", "address", "city", "state", "zip_code", "country"]
"auth.change_password": ["user_id", "current_password", "new_password"]
"auth.forgot_password": ["email"]
"auth.invite_user": ["email", "company_ids"]
"auth.accept_invitation": ["email", "invitation_code", "new_password"]
"auth.get_user_by_email": ["email"]
"auth.cleanup_expired_sessions": []
```

### Company Module (12 функций)

```typescript
"company.create_company": ["user_id", "type", "title", "logo", "website", "business_id", "tax_id", "residence", "industry", "contact"]
"company.get_user_companies": ["user_id"]
"company.get_company_by_id": ["company_id"]
"company.get_company_members": ["company_id"]
"company.get_user_role": ["user_id", "company_id"]
"company.has_access": ["user_id", "company_id"]
"company.has_permission": ["user_id", "company_id", "required_role"]
"company.add_member": ["company_id", "user_id", "role"]
"company.remove_member": ["company_id", "user_id"]
"company.update_member_role": ["company_id", "user_id", "new_role"]
"company.transfer_ownership": ["company_id", "current_owner_id", "new_owner_id"]
"company.update_company": ["company_id", "title", "logo", "website", "business_id", "tax_id", "residence", "industry", "contact", "settings"]
"company.delete_company": ["company_id"]
```

### Inquiry Module (7 функций)

```typescript
"inquiry.create_inquiry": ["name", "email", "message", "company", "phone", "attachments"]
"inquiry.get_all_inquiries": ["status", "limit", "offset"]
"inquiry.get_inquiry_by_id": ["inquiry_id"]
"inquiry.get_inquiries_by_email": ["email"]
"inquiry.get_statistics": []
"inquiry.update_status": ["inquiry_id", "status", "response"]
"inquiry.delete_inquiry": ["inquiry_id"]
```

### OrgChart Module (10 функций)

```typescript
"orgchart.create_orgchart": ["company_id", "title", "description", "code", "version", "status"]
"orgchart.create_department": ["company_id", "parent_id", "title", "description", "code", "headcount", "charter"]
"orgchart.create_position": ["company_id", "parent_id", "title", "description", "salary_min", "salary_max", "job_description"]
"orgchart.create_appointment": ["company_id", "position_id", "user_id", "appointee_fullname", "appointee_email"]
"orgchart.get_all_orgcharts": ["company_id"]
"orgchart.get_tree": ["company_id", "orgchart_id"]
"orgchart.update_node": ["node_id", "title", "description", "code", "version", "status", "headcount", "charter", "salary_min", "salary_max", "job_description"]
"orgchart.delete_node": ["node_id", "cascade"]
"orgchart.remove_appointment": ["position_id"]
"orgchart.set_company_context": ["company_id"]
```

### Reference Module (8 функций)

```typescript
"reference.get_all_countries": []
"reference.get_country_by_code": ["code"]
"reference.search_countries": ["query", "limit"]
"reference.get_countries_options": []
"reference.get_all_industries": []
"reference.get_industry_by_code": ["code"]
"reference.search_industries": ["query", "limit"]
"reference.get_industries_options": []
```

**ИТОГО: 54 функции** полностью покрыты маппингом параметров.

## Debugging

Если получаете ошибку типа "null value in column X":

1. **Проверьте логи** в консоли API сервера:
   ```
   [Hono] Calling PostgreSQL function: company.create_company
   [Hono] Params: ["user123", "workspace", null, "Title", ...]
   ```

2. **Сравните порядок** параметров с ожидаемым:
   ```sql
   \df+ company.create_company
   ```

3. **Проверьте маппинг** в `FUNCTION_PARAMS` - порядок должен совпадать!

## Best Practices

1. ✅ **Всегда используйте маппинг** - не полагайтесь на `Object.values()`
2. ✅ **Документируйте порядок** параметров в комментариях к функциям
3. ✅ **Тестируйте** после добавления новой функции
4. ✅ **Используйте TypeScript** для type safety на фронтенде

## См. также

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Принципы PostgreSQL-centric архитектуры
- [src/api/db/README.md](../src/api/db/README.md) - Документация по SQL функциям
- [src/api/routes/auth.routes.ts](../src/api/routes/auth.routes.ts) - Реализация универсального роутера

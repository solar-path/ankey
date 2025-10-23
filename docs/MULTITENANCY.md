# Мультитенантность (Multitenancy) в Ankey

## Обзор

Ankey использует партиционированные базы данных CouchDB 3.5+ для изоляции данных между компаниями (workspace). Это позволяет масштабироваться до 100,000+ компаний при сохранении высокой производительности.

## Архитектура баз данных

### Глобальные базы данных

Эти базы хранят общие данные, не привязанные к конкретной компании:

- **`users`** - пользователи системы
- **`sessions`** - сессии авторизации
- **`companies`** - метаданные компаний (название, лого, настройки)
- **`user_companies`** - связи пользователей с компаниями (M:N отношение)

### Партиционированные базы данных

Эти базы изолируют данные по компаниям используя партиционирование CouchDB:

- **`orgcharts`** - организационные структуры компаний
- **`chartofaccounts`** - планы счетов компаний

**Ключ партиции:** `company:{companyId}:`

**Пример ID документа:** `company:abc123:orgchart_v1`

## Как это работает

### 1. Создание компании

```typescript
// Пользователь создает компанию через форму
const company = await CompanyService.createCompany(userId, {
  type: "workspace",
  title: "My Company",
  residence: "US",
  industry: "5010",
  // ...
});

// Автоматически создается связь user_company
// { userId: "user_123", companyId: "company_abc", role: "owner" }
```

### 2. Переключение компании

```typescript
// При переключении компании через team-switcher
await CompanyContext.switchCompany(companyId);

// Внутри вызывается:
await CompanyDatabaseFactory.connectToCompany(companyId);

// Сохраняется в localStorage
localStorage.setItem("ankey_active_company_id", companyId);
```

### 3. Работа с данными компании

```typescript
// Все запросы автоматически фильтруются по активной компании
const orgcharts = await CompanyDatabaseFactory.getOrgCharts();

// Внутри используется партиционированный запрос:
orgchartsDB.find({
  selector: {
    _id: {
      $gte: `company:${companyId}:`,
      $lte: `company:${companyId}:\ufff0`,
    },
    type: "orgchart",
  },
});
```

### 4. Создание документов

```typescript
// Создание новой версии оргчарта
const orgchart = await CompanyDatabaseFactory.createOrgChart(
  "Org Structure v1",
  orgData,
  1
);

// Документ создается с правильным ID партиции
// _id: "company:abc123:orgchart_v1"
```

## Компоненты системы

### CompanyService ([company-service.ts](../src/modules/company/company-service.ts))

Управляет CRUD операциями для компаний:

- `createCompany()` - создание компании + user_company связь
- `getUserCompanies()` - получение всех компаний пользователя
- `updateCompany()` - обновление метаданных
- `deleteCompany()` - удаление компании

### CompanyDatabaseFactory ([company-db-factory.ts](../src/modules/shared/database/company-db-factory.ts))

Управляет доступом к партиционированным данным:

- `connectToCompany()` - подключение к базам компании
- `disconnectFromCompany()` - отключение при переключении
- `getOrgCharts()`, `getChartOfAccounts()` - запросы с автофильтрацией
- `createOrgChart()`, `createAccount()` - создание с правильными ID

### CompanyContext ([company-context.tsx](../src/lib/company-context.tsx))

React контекст для управления состоянием компаний:

- `activeCompany` - текущая активная компания
- `companies` - список всех компаний пользователя
- `switchCompany()` - переключение между компаниями
- `reloadCompanies()` - перезагрузка списка

## Безопасность и изоляция

### Уровень приложения

1. **CompanyContext** проверяет принадлежность пользователя к компании
2. **CompanyDatabaseFactory** автоматически фильтрует запросы по `companyId`
3. **localStorage** хранит только ID активной компании

### Уровень базы данных

1. **Партиции CouchDB** физически группируют документы по компаниям
2. **Индексы** создаются автоматически для каждой партиции
3. **Репликация** может быть настроена для синхронизации только данных конкретной компании

## Масштабирование

### Преимущества партиционированных баз

- **Производительность:** Запросы ограничены одной партицией
- **Масштабируемость:** До 100,000+ компаний в одной базе
- **Простота:** Не нужно создавать отдельную базу для каждой компании
- **Backup:** Легко создать бэкап данных конкретной компании

### Сравнение подходов

| Подход | Компаний | Баз данных | Сложность | Производительность |
|--------|----------|------------|-----------|-------------------|
| Отдельные БД | 1,000 | 3,000+ | Высокая | Средняя |
| Партиции | 100,000+ | 4 | Низкая | Высокая |

## Примеры использования

### Создание компании

```typescript
import { CompanyService } from "@/modules/company/company-service";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";

const { user } = useAuth();
const { reloadCompanies } = useCompany();

// Создать компанию
const company = await CompanyService.createCompany(user._id, {
  type: "workspace",
  title: "Acme Corp",
  residence: "US",
  industry: "5010",
});

// Перезагрузить список и активировать новую компанию
await reloadCompanies(company._id);
```

### Работа с оргструктурой

```typescript
import { CompanyDatabaseFactory } from "@/modules/shared/database/company-db-factory";

// Получить все версии оргчартов текущей компании
const orgcharts = await CompanyDatabaseFactory.getOrgCharts();

// Создать новую версию
const orgchart = await CompanyDatabaseFactory.createOrgChart(
  "Organization Chart v2",
  {
    departments: [
      { id: "1", name: "Engineering", head: "user_123" },
      { id: "2", name: "Sales", head: "user_456" },
    ],
  },
  2
);

// Обновить существующую версию
await CompanyDatabaseFactory.updateOrgChart(2, {
  name: "Updated Org Chart v2",
});
```

### Работа с планом счетов

```typescript
// Получить все счета текущей компании
const accounts = await CompanyDatabaseFactory.getChartOfAccounts();

// Создать новый счет
const account = await CompanyDatabaseFactory.createAccount(
  "1000",
  "Cash",
  "asset"
);

// Создать субсчет
const subAccount = await CompanyDatabaseFactory.createAccount(
  "1010",
  "Petty Cash",
  "asset",
  "1000" // parent account
);
```

## Миграция данных

Если вам нужно перенести данные между подходами:

```bash
# Экспорт данных одной компании
curl http://admin:password@127.0.0.1:5984/orgcharts/_find \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"selector":{"_id":{"$gte":"company:abc123:","$lte":"company:abc123:\ufff0"}}}' \
  > company_abc123_orgcharts.json

# Импорт в новую базу
curl http://admin:password@127.0.0.1:5984/orgcharts/_bulk_docs \
  -X POST \
  -H "Content-Type: application/json" \
  -d @company_abc123_orgcharts.json
```

## Лучшие практики

1. **Всегда проверяйте активную компанию** перед операциями с данными
2. **Используйте CompanyDatabaseFactory** вместо прямого доступа к базам
3. **Не храните companyId в state** - используйте `useCompany()` hook
4. **Обрабатывайте переключение компании** - отменяйте pending запросы
5. **Тестируйте изоляцию** - убедитесь что компания A не видит данные компании B

## Troubleshooting

### Компания не переключается

```typescript
// Проверьте localStorage
console.log(localStorage.getItem("ankey_active_company_id"));

// Проверьте текущее подключение
console.log(CompanyDatabaseFactory.getCurrentCompanyId());

// Вручную переключите
const { switchCompany } = useCompany();
await switchCompany(companyId);
```

### Данные не изолированы

```typescript
// Убедитесь что используете правильный префикс
const docId = `company:${companyId}:orgchart_v1`; // ✅ Правильно
const docId = `orgchart_v1`; // ❌ Неправильно - не будет изолировано
```

### Медленные запросы

```typescript
// Используйте партиционированные запросы
const docs = await orgchartsDB.find({
  selector: {
    _id: { $gte: "company:abc:", $lte: "company:abc:\ufff0" }, // ✅ Быстро
    type: "orgchart",
  },
});

// НЕ используйте глобальные запросы
const docs = await orgchartsDB.find({
  selector: { companyId: "abc" }, // ❌ Медленно - сканирует всю базу
});
```

## Дальнейшее развитие

### Планируется добавить:

- [ ] Роли пользователей в компаниях (owner, admin, member)
- [ ] Приглашение пользователей в компанию
- [ ] Передача владения компанией
- [ ] Архивирование компаний
- [ ] Экспорт/импорт данных компании
- [ ] Аудит действий в компании

## Ссылки

- [CouchDB Partitioned Databases](https://docs.couchdb.org/en/stable/partitioned-dbs/index.html)
- [PouchDB Documentation](https://pouchdb.com/guides/)
- [Ankey Database Setup](./COUCHDB_SETUP.md)

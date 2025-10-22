# Data Import Scripts

## Импорт справочных данных в CouchDB

Этот скрипт загружает справочные данные (страны и отрасли) из JSON файлов в CouchDB.

### Предварительные требования

1. Убедитесь, что CouchDB запущен и доступен
2. Настройте параметры подключения в `.env` файле:

```env
VITE_COUCHDB_URL=http://admin:password@127.0.0.1:5984
```

### Как запустить

```bash
bun run import:data
```

### Что делает скрипт

1. **Создает базы данных** (если их нет):
   - `countries` - справочник стран
   - `industries` - справочник отраслей

2. **Импортирует данные**:
   - Загружает страны из `src/api/db/country.json`
   - Загружает отрасли из `src/api/db/industry.json`

3. **Создает индексы** для быстрого поиска:
   - Для стран: `name`, `code`, `type`
   - Для отраслей: `code`, `title`, `type`

### Структура данных

#### Countries

```json
{
  "_id": "US",
  "code": "US",
  "name": "United States",
  "locale": "en_US",
  "language": "en",
  "currency": "USD",
  "phoneCode": "+1",
  "timezones": [...],
  "type": "country",
  "importedAt": 1234567890
}
```

#### Industries

```json
{
  "_id": "10101010",
  "code": 10101010,
  "title": "Oil & Gas Drilling",
  "description": "...",
  "type": "industry",
  "importedAt": 1234567890
}
```

### Использование в приложении

После импорта вы можете использовать эти данные в вашем приложении:

```typescript
import PouchDB from 'pouchdb';

const countriesDB = new PouchDB(`${COUCHDB_URL}/countries`);
const industriesDB = new PouchDB(`${COUCHDB_URL}/industries`);

// Получить все страны
const countries = await countriesDB.allDocs({ include_docs: true });

// Найти страну по коду
const country = await countriesDB.get('US');

// Поиск по имени
const result = await countriesDB.find({
  selector: { name: { $regex: /united/i } }
});
```

### Повторный импорт

При повторном запуске скрипт попытается создать документы заново. Если документы с такими же `_id` уже существуют, вы получите ошибки конфликта. Это нормальное поведение.

Если нужно обновить данные, сначала удалите базы данных через Fauxton (http://127.0.0.1:5984/_utils) или используйте API:

```bash
# Удалить базу данных стран
curl -X DELETE http://admin:password@127.0.0.1:5984/countries

# Удалить базу данных отраслей
curl -X DELETE http://admin:password@127.0.0.1:5984/industries
```

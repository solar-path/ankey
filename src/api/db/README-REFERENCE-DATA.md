# Reference Data Seeding

## Обзор

Справочные данные (страны и отрасли) автоматически генерируются из JSON файлов и загружаются через SQL скрипт.

## Исходные данные

- **Страны:** [scripts/data/country.json](../../../scripts/data/country.json) - 244 записи
- **Отрасли:** [scripts/data/industry.json](../../../scripts/data/industry.json) - 170 записей

## SQL Скрипт

Файл [reference.seed.sql](reference.seed.sql) содержит:
- 244 INSERT для таблицы `countries`
- 170 INSERT для таблицы `industries`
- Автоматически сгенерирован из JSON файлов

## Использование

### Локальная разработка

```bash
# Полный reset (drop + migrate + user seed + reference data)
bun run db:reset

# Только reference data
bun run db:seed:reference
```

### Перегенерация SQL файла

Если вы изменили `country.json` или `industry.json`, перегенерируйте SQL:

```bash
node -e "
const countries = require('./scripts/data/country.json');
const industries = require('./scripts/data/industry.json');

console.log('-- Reference Data Seed Script');
console.log('-- Auto-generated from country.json and industry.json');
console.log('');
console.log('BEGIN;');
console.log('');
console.log('-- ============================================');
console.log('-- COUNTRIES (' + countries.length + ' records)');
console.log('-- ============================================');
console.log('');

countries.forEach(c => {
  const code = c.code.replace(/'/g, \"''\");
  const name = c.name.replace(/'/g, \"''\");
  const locale = c.locale.replace(/'/g, \"''\");
  const language = c.language.replace(/'/g, \"''\");
  const currency = c.currency.replace(/'/g, \"''\");
  const phoneCode = c.phoneCode.replace(/'/g, \"''\");
  const timezones = JSON.stringify(c.timezones).replace(/'/g, \"''\");

  console.log(\\\`INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('\\\${code}', '\\\${name}', '\\\${locale}', '\\\${language}', '\\\${currency}', '\\\${phoneCode}', '\\\${timezones}'::jsonb);\\\`);
});

console.log('');
console.log('-- ============================================');
console.log('-- INDUSTRIES (' + industries.length + ' records)');
console.log('-- ============================================');
console.log('');

industries.forEach(i => {
  const code = i.code;
  const title = i.title.replace(/'/g, \"''\");
  const description = i.description.replace(/'/g, \"''\");

  console.log(\\\`INSERT INTO industries (code, title, description) VALUES (\\\${code}, '\\\${title}', '\\\${description}');\\\`);
});

console.log('');
console.log('COMMIT;');
console.log('');
console.log('-- Summary:');
console.log('--   Countries: ' + countries.length);
console.log('--   Industries: ' + industries.length);
" > src/api/db/reference.seed.sql
```

### Supabase Production

При деплое в Supabase, добавьте reference data после миграций:

```bash
# 1. Деплой миграций
SUPABASE_DB_URL="postgresql://..." bun run db:deploy:supabase

# 2. Настройка прав
SUPABASE_DB_URL="postgresql://..." bun run db:supabase:permissions

# 3. Загрузка reference data
psql "$SUPABASE_DB_URL" -f src/api/db/reference.seed.sql
```

Или вручную через Supabase SQL Editor:
1. Откройте Dashboard → SQL Editor
2. Скопируйте содержимое `reference.seed.sql`
3. Выполните

## Структура данных

### Countries

```sql
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) UNIQUE NOT NULL,      -- ISO 3166-1 alpha-2
  name TEXT NOT NULL,
  locale TEXT,                           -- e.g. 'en_US'
  language VARCHAR(2),                   -- ISO 639-1
  currency VARCHAR(3),                   -- ISO 4217
  phone_code TEXT,                       -- e.g. '+1'
  timezones JSONB,                       -- [{name: "America/New_York"}]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Пример записи:
```json
{
  "code": "US",
  "name": "United States",
  "locale": "en_US",
  "language": "en",
  "currency": "USD",
  "phoneCode": "+1",
  "timezones": [
    {"name": "America/New_York"},
    {"name": "America/Chicago"},
    {"name": "America/Denver"},
    {"name": "America/Los_Angeles"}
  ]
}
```

### Industries

```sql
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code INTEGER UNIQUE NOT NULL,          -- GICS code
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Пример записи:
```json
{
  "code": 45103010,
  "title": "Application Software",
  "description": "Companies engaged in developing and producing software designed for specialized applications for the business or consumer market..."
}
```

## Почему SQL, а не TypeScript?

| Критерий | SQL (reference.seed.sql) | TypeScript (seed.ts) |
|----------|-------------------------|----------------------|
| Скорость | ⚡ Очень быстро (1 транзакция) | 🐌 Медленно (414 отдельных запросов) |
| Память | 💾 Минимум (~1MB) | 🔴 Больше (Node.js runtime + JSON парсинг) |
| Простота | ✅ Стандартный SQL | ⚠️ Требует TypeScript runtime |
| Переносимость | ✅ Работает везде (psql) | ⚠️ Только где есть Node/Bun |
| Размер файла | 728 строк | ~414+ строк кода |

## Проверка

```bash
# Количество записей
psql -U postgres -d ankey -c "
  SELECT
    (SELECT COUNT(*) FROM countries) as countries,
    (SELECT COUNT(*) FROM industries) as industries;
"

# Примеры стран
psql -U postgres -d ankey -c "
  SELECT code, name, currency, phone_code
  FROM countries
  WHERE code IN ('US', 'GB', 'KZ', 'RU', 'CN')
  ORDER BY name;
"

# Примеры отраслей
psql -U postgres -d ankey -c "
  SELECT code, title
  FROM industries
  WHERE title ILIKE '%software%' OR title ILIKE '%technology%'
  ORDER BY title;
"
```

## Обновление данных

Если нужно обновить данные:

1. **Обновите JSON файлы:**
   - `scripts/data/country.json`
   - `scripts/data/industry.json`

2. **Перегенерируйте SQL:**
   ```bash
   node -e "..." > src/api/db/reference.seed.sql
   ```

3. **Примените изменения:**
   ```bash
   # Локально
   psql -U postgres -d ankey -c "TRUNCATE countries, industries CASCADE;"
   bun run db:seed:reference

   # Production (Supabase)
   psql "$SUPABASE_DB_URL" -c "TRUNCATE countries, industries CASCADE;"
   psql "$SUPABASE_DB_URL" -f src/api/db/reference.seed.sql
   ```

## Примечания

- ✅ SQL файл автоматически экранирует одинарные кавычки
- ✅ JSONB корректно форматируется для PostgreSQL
- ✅ Транзакция (BEGIN/COMMIT) обеспечивает атомарность
- ✅ Можно безопасно запускать несколько раз (данные не дублируются если есть UNIQUE constraints)

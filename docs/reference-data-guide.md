# Справочные данные в CouchDB

Руководство по работе со справочными данными (странами и отраслями) в CouchDB.

## Содержание

- [Импорт данных](#импорт-данных)
- [Использование в приложении](#использование-в-приложении)
- [API референсов](#api-референсов)
- [Примеры компонентов](#примеры-компонентов)

## Импорт данных

### Первый запуск

```bash
# Убедитесь что CouchDB запущен
curl http://127.0.0.1:5984/

# Запустите скрипт импорта
bun run import:data
```

Скрипт создаст две базы данных:
- `countries` - 244 страны
- `industries` - 170 отраслей

### Повторный импорт

При повторном запуске вы получите ошибки конфликтов (409) - это нормально, данные уже существуют.

Для полного переимпорта удалите базы:

```bash
# Удалить обе базы
curl -X DELETE http://admin:Miranda32@127.0.0.1:5984/countries
curl -X DELETE http://admin:Miranda32@127.0.0.1:5984/industries

# Запустить импорт снова
bun run import:data
```

## Использование в приложении

### Импорт утилит

```typescript
import { countries, industries } from '@/lib/reference-data';
```

### Countries API

#### Получить все страны

```typescript
const allCountries = await countries.getAll();
```

#### Получить страну по коду

```typescript
const usa = await countries.getByCode('US');
// { code: 'US', name: 'United States', currency: 'USD', ... }
```

#### Поиск по названию

```typescript
const results = await countries.searchByName('united');
// Вернет все страны с 'united' в названии
```

#### Получить список для select/dropdown

```typescript
const options = await countries.getOptions();
// [{ value: 'US', label: 'United States' }, ...]
```

#### Фильтр по валюте

```typescript
const euroCountries = await countries.getByCurrency('EUR');
```

### Industries API

#### Получить все отрасли

```typescript
const allIndustries = await industries.getAll();
```

#### Получить отрасль по коду

```typescript
const industry = await industries.getByCode(10101010);
// { code: 10101010, title: 'Oil & Gas Drilling', ... }
```

#### Поиск по названию

```typescript
const results = await industries.searchByTitle('oil');
// Вернет все отрасли с 'oil' в названии
```

#### Поиск по описанию

```typescript
const results = await industries.searchByDescription('software');
```

#### Получить список для select/dropdown

```typescript
const options = await industries.getOptions();
// [{ value: '10101010', label: 'Oil & Gas Drilling' }, ...]
```

## Примеры компонентов

### Country Select (с использованием shadcn/ui)

```tsx
import { useState, useEffect } from 'react';
import { countries, type Country } from '@/lib/reference-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/select';

export function CountrySelect() {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    countries.getOptions().then(setOptions);
  }, []);

  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Country Search с автодополнением

```tsx
import { useState } from 'react';
import { countries, type Country } from '@/lib/reference-data';
import { Input } from '@/lib/ui/input';

export function CountrySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Country[]>([]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length > 1) {
      const found = await countries.searchByName(value);
      setResults(found);
    } else {
      setResults([]);
    }
  };

  return (
    <div>
      <Input
        placeholder="Search countries..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="mt-2 border rounded-md">
          {results.map((country) => (
            <li
              key={country.code}
              className="p-2 hover:bg-accent cursor-pointer"
            >
              {country.name} ({country.code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Industry Select

```tsx
import { useState, useEffect } from 'react';
import { industries } from '@/lib/reference-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/select';

export function IndustrySelect() {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    industries.getOptions().then(setOptions);
  }, []);

  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select an industry" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Использование в формах (React Hook Form)

```tsx
import { useForm } from 'react-hook-form';
import { countries, industries } from '@/lib/reference-data';
import { useEffect, useState } from 'react';

interface FormData {
  country: string;
  industry: string;
}

export function CompanyForm() {
  const [countryOptions, setCountryOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [industryOptions, setIndustryOptions] = useState<Array<{ value: string; label: string }>>([]);

  const { register, handleSubmit } = useForm<FormData>();

  useEffect(() => {
    Promise.all([
      countries.getOptions(),
      industries.getOptions(),
    ]).then(([countries, industries]) => {
      setCountryOptions(countries);
      setIndustryOptions(industries);
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    // Получить полные данные по выбранным значениям
    const country = await countries.getByCode(data.country);
    const industry = await industries.getByCode(parseInt(data.industry));

    console.log('Selected country:', country);
    console.log('Selected industry:', industry);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <select {...register('country')}>
        <option value="">Select country</option>
        {countryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select {...register('industry')}>
        <option value="">Select industry</option>
        {industryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Структура данных

### Country

```typescript
interface Country {
  _id: string;
  _rev?: string;
  code: string;           // ISO 3166-1 alpha-2 (US, GB, CA, ...)
  name: string;           // "United States"
  locale: string;         // "en_US"
  language: string;       // "en"
  currency: string;       // "USD"
  phoneCode: string;      // "+1"
  timezones: Array<{      // Список часовых поясов
    name: string;
  }>;
  type: 'country';
  importedAt: number;     // Unix timestamp
}
```

### Industry

```typescript
interface Industry {
  _id: string;
  _rev?: string;
  code: number;           // GICS код (10101010, 10101020, ...)
  title: string;          // "Oil & Gas Drilling"
  description: string;    // Полное описание отрасли
  type: 'industry';
  importedAt: number;     // Unix timestamp
}
```

## Проверка данных

### Через curl

```bash
# Проверить количество стран
curl 'http://admin:Miranda32@127.0.0.1:5984/countries/_all_docs' | grep total_rows

# Получить страну
curl 'http://admin:Miranda32@127.0.0.1:5984/countries/US' | python3 -m json.tool

# Получить отрасль
curl 'http://admin:Miranda32@127.0.0.1:5984/industries/10101010' | python3 -m json.tool
```

### Через Fauxton (Web UI)

Откройте браузер: http://127.0.0.1:5984/_utils

Логин: `admin`
Пароль: `Miranda32`

## Дополнительные возможности

### Предзагрузка данных

Для улучшения производительности можно предзагрузить данные при старте приложения:

```typescript
import { referenceData } from '@/lib/reference-data';

// В main.tsx или App.tsx
useEffect(() => {
  referenceData.preload();
}, []);
```

### Проверка доступности данных

```typescript
const isLoaded = await referenceData.isLoaded();
if (!isLoaded) {
  console.warn('Reference data not imported yet!');
}
```

## Файлы проекта

- [scripts/import-data.ts](../scripts/import-data.ts) - Скрипт импорта
- [scripts/README.md](../scripts/README.md) - Документация скрипта
- [src/lib/reference-data.ts](../src/lib/reference-data.ts) - API для работы с данными
- [src/examples/ReferenceDataExample.tsx](../src/examples/ReferenceDataExample.tsx) - Примеры компонентов
- [src/api/db/country.json](../src/api/db/country.json) - Исходные данные стран
- [src/api/db/industry.json](../src/api/db/industry.json) - Исходные данные отраслей

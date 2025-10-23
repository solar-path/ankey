# Исправление ошибки PouchDB "Superclass is not a constructor"

## Проблема

При использовании `pouchdb-browser` возникает ошибка:
```
TypeError: The superclass is not a constructor.
Module Code (pouchdb-browser.js:427)
```

## Решение ✅

Используйте основной пакет `pouchdb` вместо `pouchdb-browser` с правильной конфигурацией Vite.

## Что было сделано

### 1. Установили правильные пакеты

```bash
# Удалили проблемный пакет
bun remove pouchdb-browser

# Установили основной пакет + плагин find
bun add pouchdb pouchdb-find
```

### 2. Обновили src/lib/db.ts

```typescript
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";

// Enable find plugin
PouchDB.plugin(PouchDBFind);

const COUCHDB_URL = "http://127.0.0.1:5984";

export const usersDB = new PouchDB("users");
export const sessionsDB = new PouchDB("sessions");

export const remoteUsersDB = new PouchDB(`${COUCHDB_URL}/users`);
export const remoteSessionsDB = new PouchDB(`${COUCHDB_URL}/sessions`);
```

### 3. Обновили vite.config.ts

```typescript
export default defineConfig({
  resolve: {
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    include: ["pouchdb", "pouchdb-find"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/pouchdb/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
});
```

### 4. Очистили кеш

```bash
rm -rf node_modules/.vite
```

## Применение исправления

Если вы клонировали проект или у вас все еще есть ошибка:

```bash
# 1. Переустановить зависимости
bun install

# 2. Очистить кеш Vite
rm -rf node_modules/.vite

# 3. Запустить dev server
bun run dev
```

## Почему это работает?

1. **Основной пакет `pouchdb`** + плагин `pouchdb-find` для queries
2. **Правильная конфигурация Vite** с `mainFields` помогает правильно разрешить модули
3. **CommonJS трансформация** корректно обрабатывает смешанные модули PouchDB
4. **Полифиллы** для `global` и `process.env` обеспечивают совместимость с браузером

## Проверка работы

После запуска откройте консоль браузера (F12) и выполните:

```javascript
// Проверить что PouchDB загружен
console.log(typeof PouchDB); // "function"

// Проверить локальную базу
usersDB.info().then(console.log);

// Проверить удаленную базу (требует запущенный CouchDB)
remoteUsersDB.info().then(console.log);
```

Если видите информацию о базах данных - всё работает! ✅

## Troubleshooting

### Если ошибка все еще появляется

1. **Убедитесь что используете правильные пакеты:**
   ```bash
   bun list | grep pouch
   # Должен показать:
   # pouchdb@9.0.0
   # pouchdb-find@9.0.0
   # НЕ должно быть: pouchdb-browser
   ```

2. **Полностью переустановите зависимости:**
   ```bash
   rm -rf node_modules
   rm bun.lock
   bun install
   rm -rf node_modules/.vite
   ```

3. **Проверьте что порты не заняты:**
   ```bash
   lsof -i :5173  # Vite dev server
   lsof -i :5984  # CouchDB
   ```

4. **Запустите в режиме отладки:**
   ```bash
   DEBUG=pouchdb:* bun run dev
   ```

### Если нужен browser-only build

Если вам действительно нужна только браузерная версия (меньший размер), можно попробовать:

```typescript
// ЭКСПЕРИМЕНТАЛЬНО - не гарантируется работа
import PouchDB from 'pouchdb/dist/pouchdb.js';
```

Но рекомендуется использовать основной пакет, так как он стабильнее работает с Vite.

## Дополнительные ресурсы

- [PouchDB API Docs](https://pouchdb.com/api.html)
- [Vite Config Reference](https://vitejs.dev/config/)
- [CouchDB Setup Guide](./COUCHDB_SETUP.md)
- [Complete PouchDB Reference](./docs/couchDb.llm.txt)

# Настройка CouchDB для проекта Ankey

> **Важно:** Проект использует пакет `pouchdb` (не `pouchdb-browser`), который работает стабильно с правильной конфигурацией Vite.



## Содержание
1. [Установка CouchDB](#установка-couchdb)
2. [Первоначальная настройка](#первоначальная-настройка)
3. [Настройка CORS](#настройка-cors)
4. [Создание баз данных](#создание-баз-данных)
5. [Настройка пользователей и прав доступа](#настройка-пользователей-и-прав-доступа)
6. [Проверка интеграции](#проверка-интеграции)
7. [Troubleshooting](#troubleshooting)

---

## Установка CouchDB

### macOS

**Способ 1: Homebrew (рекомендуется)**
```bash
# Установка CouchDB
brew install couchdb

# Запуск CouchDB как сервис
brew services start couchdb

# Проверка статуса
brew services list | grep couchdb
```

**Способ 2: Официальный установщик**
1. Скачать с https://couchdb.apache.org/
2. Запустить `.dmg` файл
3. Следовать инструкциям установщика

### Linux (Ubuntu/Debian)

```bash
# Добавить репозиторий CouchDB
sudo apt update && sudo apt install -y curl apt-transport-https gnupg

# Добавить ключ GPG
curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1

# Получить версию кода
source /etc/os-release
VERSION_CODENAME=$VERSION_CODENAME

# Добавить репозиторий
echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ ${VERSION_CODENAME} main" \
    | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null

# Установить CouchDB
sudo apt-get update
sudo apt-get install -y couchdb
```

Во время установки выберите:
- **Standalone** (для разработки)
- Придумайте пароль администратора
- Оставьте порт `5984` (по умолчанию)

### Windows

1. Скачать установщик с https://couchdb.apache.org/
2. Запустить `.exe` файл
3. Следовать инструкциям:
   - Выбрать "Install as service"
   - Выбрать "Standalone mode"
   - Установить пароль администратора
   - Оставить порт 5984

### Docker (альтернатива)

```bash
# Запустить CouchDB в контейнере
docker run -d \
  --name couchdb \
  -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  -v couchdb-data:/opt/couchdb/data \
  couchdb:latest

# Проверить логи
docker logs couchdb
```

---

## Первоначальная настройка

### 1. Проверка установки

```bash
# Проверить что CouchDB запущен
curl http://127.0.0.1:5984

# Ожидаемый ответ:
# {"couchdb":"Welcome","version":"3.x.x","git_sha":"...","uuid":"...","features":["..."]}
```

Если видите ответ выше - CouchDB работает! ✅

### 2. Доступ к веб-интерфейсу Fauxton

Откройте в браузере: **http://127.0.0.1:5984/_utils/**

Вы увидите красивый веб-интерфейс Fauxton для управления CouchDB.

**Первый вход:**
1. Нажмите "Setup" в правом верхнем углу
2. Выберите "Configure a Single Node"
3. Заполните данные админа:
   - **Admin Username**: `admin` (или другое имя)
   - **Admin Password**: ваш безопасный пароль
   - **Host**: `127.0.0.1`
   - **Port**: `5984`
4. Нажмите "Configure Node"

### 3. Проверка аутентификации

```bash
# Проверить информацию о сервере (с аутентификацией)
curl -X GET http://admin:password@127.0.0.1:5984/_all_dbs

# Должен вернуть список баз данных: []
```

---

## Настройка CORS

**Почему это важно?**
Браузерные приложения не могут делать запросы к CouchDB без настройки CORS (Cross-Origin Resource Sharing).

### Автоматическая настройка (рекомендуется)

```bash
# Установить утилиту
npm install -g add-cors-to-couchdb

# Запустить настройку
add-cors-to-couchdb

# Следовать инструкциям:
# - CouchDB URL: http://127.0.0.1:5984
# - Admin username: admin
# - Admin password: ваш_пароль
```

### Ручная настройка

Если автоматическая настройка не сработала:

```bash
# Включить CORS
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors \
  -d '"true"'

# Разрешить все источники (для разработки)
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/origins \
  -d '"*"'

# Включить credentials
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/credentials \
  -d '"true"'

# Разрешить методы
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/methods \
  -d '"GET, PUT, POST, HEAD, DELETE"'

# Разрешить заголовки
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/headers \
  -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'
```

### Проверка CORS

```bash
# Проверить настройки CORS
curl -X GET http://admin:password@127.0.0.1:5984/_node/_local/_config/cors
```

Ожидаемый ответ:
```json
{
  "credentials": "true",
  "origins": "*",
  "methods": "GET, PUT, POST, HEAD, DELETE",
  "headers": "accept, authorization, content-type, origin, referer, x-csrf-token"
}
```

---

## Создание баз данных

### Через Fauxton (визуально)

1. Откройте http://127.0.0.1:5984/_utils/
2. Войдите с логином и паролем администратора
3. Нажмите "Create Database" в правом верхнем углу
4. Создайте две базы:
   - `users` - для хранения пользователей
   - `sessions` - для хранения сессий

### Через командную строку

```bash
# Создать базу users
curl -X PUT http://admin:password@127.0.0.1:5984/users

# Создать базу sessions
curl -X PUT http://admin:password@127.0.0.1:5984/sessions

# Проверить список баз
curl -X GET http://admin:password@127.0.0.1:5984/_all_dbs
```

Ожидаемый ответ:
```json
["_replicator","_users","sessions","users"]
```

### Через Node.js/TypeScript

```typescript
import PouchDB from "pouchdb-browser";

const COUCHDB_URL = "http://admin:password@127.0.0.1:5984";

// Подключиться к удаленным базам (создадутся автоматически)
const remoteUsersDB = new PouchDB(`${COUCHDB_URL}/users`);
const remoteSessionsDB = new PouchDB(`${COUCHDB_URL}/sessions`);

// Проверить информацию о базе
remoteUsersDB.info().then(info => {
  console.log("Users DB:", info);
});
```

---

## Настройка пользователей и прав доступа

### Создание обычного пользователя (не админ)

```bash
# Создать пользователя
curl -X PUT http://admin:password@127.0.0.1:5984/_users/org.couchdb.user:testuser \
  -H "Content-Type: application/json" \
  -d '{
    "name": "testuser",
    "password": "testpass",
    "roles": [],
    "type": "user"
  }'
```

### Настройка прав доступа к базам данных

**Для разработки (публичный доступ):**
```bash
# Разрешить всем читать и писать в users
curl -X PUT http://admin:password@127.0.0.1:5984/users/_security \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": ["admin"], "roles": []},
    "members": {"names": [], "roles": []}
  }'

# То же для sessions
curl -X PUT http://admin:password@127.0.0.1:5984/sessions/_security \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": ["admin"], "roles": []},
    "members": {"names": [], "roles": []}
  }'
```

**Для продакшена (ограниченный доступ):**
```bash
# Только аутентифицированные пользователи
curl -X PUT http://admin:password@127.0.0.1:5984/users/_security \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": ["admin"], "roles": ["admin"]},
    "members": {"names": ["testuser"], "roles": ["user"]}
  }'
```

### Проверка прав доступа

```bash
# Получить права доступа к базе users
curl -X GET http://admin:password@127.0.0.1:5984/users/_security
```

---

## Проверка интеграции

### 1. Проверка подключения из приложения

Создайте тестовый файл `test-couchdb.ts`:

```typescript
import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";

PouchDB.plugin(PouchDBFind);

const COUCHDB_URL = "http://127.0.0.1:5984";

// Локальная база
const localDB = new PouchDB("test-local");

// Удаленная база
const remoteDB = new PouchDB(`${COUCHDB_URL}/users`);

// Тест 1: Проверка подключения к удаленной базе
async function testConnection() {
  try {
    const info = await remoteDB.info();
    console.log("✅ CouchDB connection successful:", info);
    return true;
  } catch (error) {
    console.error("❌ CouchDB connection failed:", error);
    return false;
  }
}

// Тест 2: Создание документа
async function testCreateDocument() {
  try {
    const doc = {
      _id: "test_" + Date.now(),
      type: "test",
      message: "Hello from PouchDB!"
    };

    const result = await localDB.put(doc);
    console.log("✅ Document created:", result);
    return true;
  } catch (error) {
    console.error("❌ Document creation failed:", error);
    return false;
  }
}

// Тест 3: Синхронизация
async function testSync() {
  try {
    const result = await localDB.sync(remoteDB);
    console.log("✅ Sync successful:", result);
    return true;
  } catch (error) {
    console.error("❌ Sync failed:", error);
    return false;
  }
}

// Запуск всех тестов
async function runTests() {
  console.log("🧪 Starting CouchDB integration tests...\n");

  await testConnection();
  await testCreateDocument();
  await testSync();

  console.log("\n✅ All tests completed!");
}

runTests();
```

Запустите:
```bash
bun run test-couchdb.ts
```

### 2. Проверка через браузер

1. Запустите приложение: `bun run dev`
2. Откройте DevTools (F12) → Console
3. Выполните:

```javascript
// Проверить локальную базу
usersDB.info().then(console.log);

// Проверить удаленную базу
remoteUsersDB.info().then(console.log);

// Создать тестовый документ
usersDB.put({
  _id: 'test',
  type: 'test',
  message: 'Hello!'
}).then(console.log);
```

### 3. Проверка синхронизации

В браузерной консоли:

```javascript
// Запустить синхронизацию
const sync = usersDB.sync(remoteUsersDB, {
  live: true,
  retry: true
});

sync.on('change', (info) => {
  console.log('Sync change:', info);
});

sync.on('error', (err) => {
  console.error('Sync error:', err);
});

sync.on('paused', () => {
  console.log('Sync paused');
});

sync.on('active', () => {
  console.log('Sync active');
});
```

Затем проверьте в Fauxton (http://127.0.0.1:5984/_utils/) - документ должен появиться в удаленной базе!

---

## Troubleshooting

### Проблема: CouchDB не запускается

**Решение 1: Проверить порт**
```bash
# Проверить что порт 5984 свободен
lsof -i :5984

# Если порт занят, убить процесс
kill -9 <PID>
```

**Решение 2: Проверить логи**
```bash
# macOS (Homebrew)
tail -f /usr/local/var/log/couchdb/couchdb.log

# Linux
tail -f /var/log/couchdb/couchdb.log

# Docker
docker logs couchdb
```

**Решение 3: Переустановить**
```bash
# macOS
brew services stop couchdb
brew uninstall couchdb
brew install couchdb
brew services start couchdb
```

### Проблема: CORS ошибки в браузере

**Симптомы:**
```
Access to XMLHttpRequest at 'http://127.0.0.1:5984/users' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Решение:**
```bash
# Повторно настроить CORS
add-cors-to-couchdb

# Или вручную (см. раздел "Настройка CORS")
```

### Проблема: 401 Unauthorized

**Причина:** Не настроена аутентификация

**Решение:**
```typescript
// Добавить credentials в URL
const COUCHDB_URL = "http://admin:password@127.0.0.1:5984";

// Или использовать fetch с credentials
const remoteDB = new PouchDB(`http://127.0.0.1:5984/users`, {
  fetch: function (url, opts) {
    opts.headers.set('Authorization', 'Basic ' + btoa('admin:password'));
    return PouchDB.fetch(url, opts);
  }
});
```

### Проблема: Медленная синхронизация

**Решение 1: Оптимизация конфигурации**
```bash
# Увеличить параллельные запросы
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/httpd/max_connections \
  -d '"2048"'

# Увеличить таймауты
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/couchdb/max_document_size \
  -d '"67108864"'
```

**Решение 2: Использовать батч-операции**
```typescript
// Вместо множества put()
docs.forEach(doc => db.put(doc));

// Использовать bulkDocs()
db.bulkDocs(docs);
```

### Проблема: "PouchDB is not defined"

**Причина:** PouchDB не загружен

**Решение:**
```bash
# Убедиться что пакеты установлены
bun install

# Очистить кеш Vite
rm -rf node_modules/.vite

# Перезапустить dev server
bun run dev
```

### Проблема: Документы не синхронизируются

**Проверки:**

1. **CouchDB работает?**
   ```bash
   curl http://127.0.0.1:5984
   ```

2. **CORS настроен?**
   ```bash
   curl -X GET http://admin:password@127.0.0.1:5984/_node/_local/_config/cors
   ```

3. **Базы данных существуют?**
   ```bash
   curl -X GET http://admin:password@127.0.0.1:5984/_all_dbs
   ```

4. **Синхронизация запущена?**
   ```typescript
   // Проверить в консоли браузера
   console.log('Sync status:', sync);
   ```

5. **Нет ошибок в консоли?**
   - Откройте DevTools (F12) → Console
   - Проверьте Network tab на ошибки

---

## Рекомендации для продакшена

### 1. Безопасность

- [ ] Изменить пароль администратора
- [ ] Создать отдельных пользователей для приложения
- [ ] Настроить файрвол (закрыть порт 5984 извне)
- [ ] Использовать HTTPS (через nginx/caddy)
- [ ] Настроить строгие права доступа к базам
- [ ] Включить аудит логов

### 2. Производительность

- [ ] Настроить компактацию баз данных
- [ ] Мониторить размер баз
- [ ] Оптимизировать индексы
- [ ] Использовать репликацию для резервирования
- [ ] Настроить балансировку нагрузки (если нужно)

### 3. Резервное копирование

```bash
# Создать бэкап базы
curl -X GET http://admin:password@127.0.0.1:5984/users/_all_docs?include_docs=true \
  > users_backup.json

# Восстановить из бэкапа
curl -X POST http://admin:password@127.0.0.1:5984/users/_bulk_docs \
  -H "Content-Type: application/json" \
  -d @users_backup.json
```

### 4. Мониторинг

```bash
# Проверить статус
curl http://admin:password@127.0.0.1:5984/_up

# Проверить активные задачи
curl http://admin:password@127.0.0.1:5984/_active_tasks

# Статистика
curl http://admin:password@127.0.0.1:5984/_stats
```

---

## Дополнительные ресурсы

- 📖 [Официальная документация CouchDB](https://docs.couchdb.org/)
- 📖 [PouchDB Guides](https://pouchdb.com/guides/)
- 🎥 [CouchDB Video Tutorial](https://www.youtube.com/watch?v=nlqv9Np3iAU)
- 💬 [CouchDB Community](https://couchdb.apache.org/#chat)
- 📝 [CouchDB Best Practices](https://docs.couchdb.org/en/stable/best-practices/index.html)

---

## Следующие шаги

После настройки CouchDB:

1. ✅ Убедитесь что CouchDB запущен
2. ✅ Настроен CORS
3. ✅ Созданы базы `users` и `sessions`
4. ✅ Проверена синхронизация
5. 🚀 Запустите приложение: `bun run dev`
6. 📝 Зарегистрируйте тестового пользователя
7. 🔍 Проверьте данные в Fauxton

**Готово!** CouchDB настроен и интегрирован с проектом! 🎉

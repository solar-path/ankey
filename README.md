# Ankey - Authentication & PouchDB Project

Local-first authentication system with real-time sync to CouchDB.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Clear Vite cache (if needed)
rm -rf node_modules/.vite

# Start development server
bun run dev
```

## 📚 Documentation

- **[START_HERE.md](START_HERE.md)** - Quick start guide
- **[POUCHDB_FIX.md](POUCHDB_FIX.md)** - Fix "Superclass is not a constructor" error 🔧
- **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** - Complete setup overview
- **[AUTH_SETUP.md](AUTH_SETUP.md)** - Authentication system details
- **[docs/COUCHDB_SETUP.md](docs/COUCHDB_SETUP.md)** - CouchDB installation & configuration ⭐
- **[docs/couchDb.llm.txt](docs/couchDb.llm.txt)** - Complete PouchDB/CouchDB reference

## 🛠️ Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **PouchDB** - Local database (via npm: `pouchdb@9.0.0`)
- **CouchDB** - Remote database (sync target)
- **Tailwind CSS** - Styling
- **Wouter** - Routing
- **Valibot** - Validation
- **Sonner** - Toast notifications

## 📦 Key Features

- ✅ Local-first architecture with PouchDB
- ✅ Real-time sync with CouchDB
- ✅ Custom authentication system
- ✅ Mobile-responsive UI with hamburger menu
- ✅ Route protection
- ✅ Session management
- ✅ Offline support

## 🔧 Configuration

### PouchDB Integration

PouchDB установлен через npm (основной пакет, не browser-версия):

```typescript
// src/lib/db.ts
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";

PouchDB.plugin(PouchDBFind);
```

> **Важно:** Используется пакет `pouchdb` (не `pouchdb-browser`) для стабильной работы с Vite.

### Vite Configuration

```typescript
// vite.config.ts
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
  },
  build: {
    commonjsOptions: {
      include: [/pouchdb/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
});
```

## 🗄️ Database Setup

See **[docs/COUCHDB_SETUP.md](docs/COUCHDB_SETUP.md)** for detailed CouchDB setup instructions.

**Quick Setup:**

1. Install CouchDB: `brew install couchdb`
2. Start CouchDB: `brew services start couchdb`
3. Setup CORS: `npx add-cors-to-couchdb`
4. Access Fauxton: http://127.0.0.1:5984/_utils/

## 🔐 Authentication Flow

1. **Sign Up** → Create account (unverified)
2. **Verify** → Enter 6-digit code (check console)
3. **Sign In** → Authenticate and create session
4. **Access Dashboard** → Protected route at `/dashboard`

## 📂 Project Structure

```
src/
├── lib/
│   ├── db.ts                    # PouchDB setup & sync
│   ├── auth-service.ts          # Authentication logic
│   ├── auth-context.tsx         # Auth state management
│   └── ui/                      # UI components
├── modules/
│   ├── auth/                    # Auth pages & schemas
│   └── company/                 # Dashboard pages
└── routes/
    ├── public.layout.tsx        # Public pages layout
    └── private.layout.tsx       # Protected pages layout
```

## 🧪 Testing

```bash
# Type checking
bunx tsc --noEmit

# Build
bun run build

# Preview build
bun run preview
```

## 🐛 Troubleshooting

### PouchDB Errors

If you see "Superclass is not a constructor":

```bash
rm -rf node_modules/.vite
bun run dev
```

### CouchDB Connection Issues

1. Check CouchDB is running: `curl http://127.0.0.1:5984`
2. Verify CORS: See [docs/COUCHDB_SETUP.md](docs/COUCHDB_SETUP.md#настройка-cors)
3. Check databases exist: Visit http://127.0.0.1:5984/_utils/

### Verification Code Not Showing

Check the **browser console** (F12 → Console), not the terminal!

## 📖 Learn More

- [PouchDB Documentation](https://pouchdb.com/guides/)
- [CouchDB Documentation](https://docs.couchdb.org/)
- [Complete Project Guide](docs/couchDb.llm.txt)

## 🎯 Next Steps

1. ✅ Setup CouchDB (see [docs/COUCHDB_SETUP.md](docs/COUCHDB_SETUP.md))
2. ✅ Configure CORS
3. ✅ Test authentication flow
4. 🎨 Start building your features!

---

**Need help?** Check the documentation files or open an issue.

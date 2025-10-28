# Sync Integration Usage Guide

## Overview

This guide explains how to integrate the new controlled synchronization strategy with react-hook-form in your components.

## Architecture

The new sync strategy ensures:
- **CouchDB is the source of truth**
- **On app load**: Pull fresh data from CouchDB (incremental, only changes)
- **On data changes**: Immediately push to CouchDB for real-time updates
- **On app exit**: Final push to guarantee all changes are saved
- **Live pull**: All users receive updates as they're made by others

## Components

### 1. Sync Service (`sync.service.ts`)

Core synchronization functions:

```typescript
import { pullFromRemote, pushToRemote, startLivePull, syncOnChange } from '@/modules/shared/database/sync.service';

// Pull from CouchDB (incremental)
await pullFromRemote(localDB, remoteDB, 'dbName');

// Push to CouchDB
await pushToRemote(localDB, remoteDB, 'dbName');

// Start live pull (one-way: remote → local)
startLivePull(localDB, remoteDB, 'dbName');

// Sync after form change
await syncOnChange(localDB, remoteDB, 'dbName');
```

### 2. Database Setup (`db.ts`)

Central database configuration with sync lifecycle:

```typescript
import { setupSync, cleanupSync, syncDatabaseOnChange } from '@/modules/shared/database/db';

// Initialize sync on app load
await setupSync();

// Sync specific database after changes
await syncDatabaseOnChange('users');

// Cleanup before app exit
await cleanupSync();
```

### 3. React Hook (`useSyncOnSubmit`)

Integrates sync with react-hook-form:

```typescript
import { useSyncOnSubmit } from '@/modules/shared/hooks/useSyncOnSubmit';

const form = useForm<MyFormData>({
  resolver: valibotResolver(mySchema),
});

const { handleSubmitWithSync } = useSyncOnSubmit('dbName', form);

const onSubmit = handleSubmitWithSync(async (data) => {
  // Your form submission logic
  await MyService.create(data);
  // Sync happens automatically after successful submission
});
```

### 4. Sync Indicator (`SyncIndicator`)

Visual feedback component:

```typescript
import { SyncIndicator } from '@/lib/ui/sync-indicator';

// Add to your layout
<SyncIndicator />
```

Shows:
- ✅ Green checkmark: All databases synced
- 🔄 Blue spinner: Syncing in progress (with direction)
- ❌ Red X: Sync error (hover for details)
- 📡 Yellow wifi-off: Offline mode

## Usage Examples

### Example 1: Basic Form with Sync

```typescript
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useSyncOnSubmit } from "@/modules/shared/hooks/useSyncOnSubmit";
import * as v from "valibot";

const schema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});

type FormData = v.InferOutput<typeof schema>;

export function MyForm() {
  const form = useForm<FormData>({
    resolver: valibotResolver(schema),
  });

  const { handleSubmitWithSync } = useSyncOnSubmit('users', form);

  const onSubmit = handleSubmitWithSync(async (data) => {
    // Create user in local database
    await usersDB.put({
      _id: `user_${Date.now()}`,
      type: 'user',
      ...data,
    });

    // Sync happens automatically after this
    toast.success('User created and synced!');
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Example 2: Company Form (Real Example)

```typescript
// src/modules/company/company.form.tsx
import { useSyncOnSubmit } from "@/modules/shared/hooks/useSyncOnSubmit";
import { CompanyService } from "./company-service";

export function CompanyForm({ companyId }: { companyId?: string }) {
  const form = useForm<CompanyFormData>({
    resolver: valibotResolver(companySchema),
  });

  const { handleSubmitWithSync } = useSyncOnSubmit('companies', form);

  const onSubmit = handleSubmitWithSync(async (data) => {
    if (companyId) {
      await CompanyService.update(companyId, data);
      toast.success('Company updated and synced!');
    } else {
      await CompanyService.create(data);
      toast.success('Company created and synced!');
    }
    // Sync happens automatically after this
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Example 3: Orgchart Form with Partitioned Database

```typescript
// src/modules/htr/orgchart/orgchart.form.tsx
import { useSyncOnSubmit } from "@/modules/shared/hooks/useSyncOnSubmit";
import { OrgChartService } from "./orgchart-service";

export function OrgChartForm({ orgChartId }: { orgChartId?: string }) {
  const form = useForm<OrgChartFormData>({
    resolver: valibotResolver(orgChartSchema),
  });

  // Sync to orgcharts database (partitioned by company)
  const { handleSubmitWithSync } = useSyncOnSubmit('orgcharts', form);

  const onSubmit = handleSubmitWithSync(async (data) => {
    if (orgChartId) {
      await OrgChartService.update(orgChartId, data);
    } else {
      await OrgChartService.create(data);
    }
    // Sync happens automatically after this
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Example 4: Manual Sync (Without Form)

If you need to sync outside of a form context:

```typescript
import { syncDatabaseOnChange } from '@/modules/shared/database/db';

async function deleteUser(userId: string) {
  // Delete from local database
  const user = await usersDB.get(userId);
  await usersDB.remove(user);

  // Manually trigger sync
  await syncDatabaseOnChange('users');

  toast.success('User deleted and synced!');
}
```

## App Integration

The sync lifecycle is automatically managed in `App.tsx`:

```typescript
// App.tsx
import { setupSync, cleanupSync } from "./modules/shared/database/db";

function App() {
  useEffect(() => {
    // Initialize sync on app load
    setupSync().catch((err) => {
      console.error("[App] Failed to setup sync:", err);
    });

    // Cleanup sync before app exit
    return () => {
      cleanupSync().catch((err) => {
        console.error("[App] Failed to cleanup sync:", err);
      });
    };
  }, []);

  // ... rest of app
}
```

## Available Databases

Current databases with sync support:

- `users` - User accounts
- `sessions` - Auth sessions
- `inquiries` - Contact form inquiries
- `companies` - Company metadata
- `user_companies` - User-company relationships
- `orgcharts` - Organizational charts (partitioned)
- `chartofaccounts` - Chart of accounts (partitioned)
- `tasks` - Tasks and approvals

## Monitoring Sync Status

### In Browser Console

```javascript
// Check sync status for a database
import { getSyncStatus } from '@/modules/shared/database/sync.service';
console.log(getSyncStatus('users'));

// Check all sync statuses
import { getAllSyncStatuses } from '@/modules/shared/database/sync.service';
console.log(getAllSyncStatuses());
```

### Via Custom Events

Listen to sync events in your components:

```typescript
useEffect(() => {
  const handleSyncChange = (event: Event) => {
    const { dbName, status } = (event as CustomEvent).detail;
    console.log(`${dbName}: ${status.status}`);
  };

  window.addEventListener('sync-status-change', handleSyncChange);

  return () => {
    window.removeEventListener('sync-status-change', handleSyncChange);
  };
}, []);
```

### Via UI Component

Use the `SyncIndicator` component (already added to `PrivateLayout`):

```typescript
import { SyncIndicator } from '@/lib/ui/sync-indicator';

// Shows real-time sync status with tooltip
<SyncIndicator />
```

## Best Practices

1. **Always use the hook for forms**: Don't manually call sync functions in form handlers
2. **Handle errors**: The hook re-throws errors so your form can handle them
3. **Use toast notifications**: Inform users when data is saved and synced
4. **Monitor sync status**: Use the SyncIndicator to show sync state
5. **Test offline**: Verify that changes queue and sync when connection is restored

## Troubleshooting

### Sync Not Triggering

- Check that you're using `handleSubmitWithSync` wrapper
- Verify database name matches one in `databasePairs` array
- Check browser console for sync errors

### Sync Errors

- Check CouchDB is running: `curl http://localhost:5984`
- Verify CORS is enabled: `add-cors-to-couchdb`
- Check network connectivity
- Review browser console for detailed errors

### Data Not Updating

- Check if live pull is running (should start automatically)
- Verify CouchDB has the latest data
- Clear browser IndexedDB and refresh app
- Check for conflicts in CouchDB

## Technical Details

### Incremental Replication

PouchDB only syncs changes (not all data):

```typescript
// Only documents modified since last sync are transferred
await localDB.replicate.from(remoteDB);
```

### Live Replication

One-way live sync keeps local data updated:

```typescript
localDB.replicate.from(remoteDB, {
  live: true,   // Keep sync running
  retry: true,  // Auto-reconnect
});
```

### Conflict Resolution

Conflicts are automatically resolved using CouchDB's revision system. In rare cases of complex conflicts, manual resolution may be needed.

## Migration from Old Sync

The old bidirectional sync (`localDB.sync(remoteDB)`) has been replaced with controlled sync. No changes needed in existing code except:

1. Replace manual sync calls with `useSyncOnSubmit` hook
2. Remove any custom sync logic from forms
3. Rely on automatic sync lifecycle in `App.tsx`

## Summary

The new sync strategy provides:
- ✅ CouchDB as single source of truth
- ✅ Incremental sync (only changes)
- ✅ Real-time updates for all users
- ✅ Automatic form integration
- ✅ Visual feedback with SyncIndicator
- ✅ Guaranteed data persistence

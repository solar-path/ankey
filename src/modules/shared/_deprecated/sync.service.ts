/**
 * Sync Service
 *
 * Manages controlled synchronization between PouchDB (local) and CouchDB (remote)
 *
 * Strategy:
 * 1. On app load: Pull from CouchDB (source of truth) + Start live pull
 * 2. On data change: Push to CouchDB immediately (for real-time updates)
 * 3. On app exit: Final push to CouchDB (guarantee save)
 *
 * CouchDB is the single source of truth.
 * PouchDB syncs incrementally (only changes, not all data).
 */

// Type for sync status
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncInfo {
  status: SyncStatus;
  lastSync: number | null;
  error: Error | null;
  direction: 'pull' | 'push' | 'both' | null;
}

// Store active sync handlers for cancellation
const activeSyncs: Map<string, any> = new Map();
const syncStatus: Map<string, SyncInfo> = new Map();

/**
 * Initialize sync status for a database
 */
function initSyncStatus(dbName: string): void {
  if (!syncStatus.has(dbName)) {
    syncStatus.set(dbName, {
      status: 'idle',
      lastSync: null,
      error: null,
      direction: null,
    });
  }
}

/**
 * Update sync status
 */
function updateSyncStatus(
  dbName: string,
  updates: Partial<SyncInfo>
): void {
  initSyncStatus(dbName);
  const current = syncStatus.get(dbName)!;
  syncStatus.set(dbName, { ...current, ...updates });

  // Emit event for UI updates
  window.dispatchEvent(new CustomEvent('sync-status-change', {
    detail: { dbName, status: syncStatus.get(dbName) }
  }));
}

/**
 * Pull data from CouchDB to PouchDB (incremental)
 * Only syncs changes since last sync
 */
export async function pullFromRemote(
  localDB: any,
  remoteDB: any,
  dbName: string
): Promise<void> {
  console.log(`[SyncService] Pulling ${dbName} from remote...`);
  initSyncStatus(dbName);

  updateSyncStatus(dbName, {
    status: 'syncing',
    direction: 'pull',
    error: null,
  });

  return new Promise((resolve, reject) => {
    localDB.replicate.from(remoteDB)
      .on('complete', (info: any) => {
        console.log(`[SyncService] Pull complete for ${dbName}:`, info);
        updateSyncStatus(dbName, {
          status: 'idle',
          lastSync: Date.now(),
          direction: null,
        });
        resolve();
      })
      .on('error', (err: any) => {
        console.error(`[SyncService] Pull error for ${dbName}:`, err);
        updateSyncStatus(dbName, {
          status: 'error',
          error: err,
          direction: null,
        });
        reject(err);
      });
  });
}

/**
 * Push data from PouchDB to CouchDB
 * Used after data changes and before app exit
 */
export async function pushToRemote(
  localDB: any,
  remoteDB: any,
  dbName: string
): Promise<void> {
  console.log(`[SyncService] Pushing ${dbName} to remote...`);
  initSyncStatus(dbName);

  updateSyncStatus(dbName, {
    status: 'syncing',
    direction: 'push',
    error: null,
  });

  return new Promise((resolve, reject) => {
    localDB.replicate.to(remoteDB)
      .on('complete', (info: any) => {
        console.log(`[SyncService] Push complete for ${dbName}:`, info);
        updateSyncStatus(dbName, {
          status: 'idle',
          lastSync: Date.now(),
          direction: null,
        });
        resolve();
      })
      .on('error', (err: any) => {
        console.error(`[SyncService] Push error for ${dbName}:`, err);
        updateSyncStatus(dbName, {
          status: 'error',
          error: err,
          direction: null,
        });
        reject(err);
      });
  });
}

/**
 * Start live pull sync (one-way: remote → local)
 * Keeps local data up-to-date with remote changes
 * Other users' changes are pulled automatically
 */
export function startLivePull(
  localDB: any,
  remoteDB: any,
  dbName: string
): void {
  console.log(`[SyncService] Starting live pull for ${dbName}`);

  // Cancel existing sync if any
  stopSync(dbName);

  initSyncStatus(dbName);

  const sync = localDB.replicate.from(remoteDB, {
    live: true,
    retry: true,
  })
    .on('change', (info: any) => {
      console.log(`[SyncService] Live pull change for ${dbName}:`, info);
      updateSyncStatus(dbName, {
        lastSync: Date.now(),
      });

      // Emit change event for UI updates
      window.dispatchEvent(new CustomEvent('db-change', {
        detail: { dbName, change: info }
      }));
    })
    .on('paused', (_info: any) => {
      console.log(`[SyncService] Live pull paused for ${dbName} (offline?)`);
      updateSyncStatus(dbName, {
        status: 'offline',
      });
    })
    .on('active', (_info: any) => {
      console.log(`[SyncService] Live pull resumed for ${dbName}`);
      updateSyncStatus(dbName, {
        status: 'idle',
      });
    })
    .on('error', (err: any) => {
      console.error(`[SyncService] Live pull error for ${dbName}:`, err);
      updateSyncStatus(dbName, {
        status: 'error',
        error: err,
      });
    });

  activeSyncs.set(dbName, sync);
}

/**
 * Stop live sync for a database
 */
export function stopSync(dbName: string): void {
  const sync = activeSyncs.get(dbName);
  if (sync) {
    console.log(`[SyncService] Stopping sync for ${dbName}`);
    sync.cancel();
    activeSyncs.delete(dbName);
  }
}

/**
 * Stop all active syncs
 * Called before app exit
 */
export function stopAllSyncs(): void {
  console.log('[SyncService] Stopping all active syncs');
  activeSyncs.forEach((_sync, dbName) => {
    stopSync(dbName);
  });
  activeSyncs.clear();
}

/**
 * Get current sync status for a database
 */
export function getSyncStatus(dbName: string): SyncInfo {
  initSyncStatus(dbName);
  return syncStatus.get(dbName)!;
}

/**
 * Get all sync statuses
 */
export function getAllSyncStatuses(): Map<string, SyncInfo> {
  return new Map(syncStatus);
}

/**
 * Sync on change (called after react-hook-form submit)
 * Immediately push changes to CouchDB for real-time updates
 */
export async function syncOnChange(
  localDB: any,
  remoteDB: any,
  dbName: string
): Promise<void> {
  console.log(`[SyncService] Syncing ${dbName} on change...`);
  await pushToRemote(localDB, remoteDB, dbName);
}

/**
 * Initialize sync for a database pair
 * Called on app load
 */
export async function initializeSync(
  localDB: any,
  remoteDB: any,
  dbName: string
): Promise<void> {
  console.log(`[SyncService] Initializing sync for ${dbName}`);

  try {
    // 1. Pull from remote (source of truth)
    await pullFromRemote(localDB, remoteDB, dbName);

    // 2. Start live pull (keep local up-to-date)
    startLivePull(localDB, remoteDB, dbName);

    console.log(`[SyncService] Sync initialized for ${dbName}`);
  } catch (error) {
    console.error(`[SyncService] Failed to initialize sync for ${dbName}:`, error);
    throw error;
  }
}

/**
 * Finalize sync before app exit
 * Push all local changes to CouchDB
 */
export async function finalizeSync(
  localDB: any,
  remoteDB: any,
  dbName: string
): Promise<void> {
  console.log(`[SyncService] Finalizing sync for ${dbName}`);

  try {
    // Stop live sync
    stopSync(dbName);

    // Final push to CouchDB
    await pushToRemote(localDB, remoteDB, dbName);

    console.log(`[SyncService] Sync finalized for ${dbName}`);
  } catch (error) {
    console.error(`[SyncService] Failed to finalize sync for ${dbName}:`, error);
    throw error;
  }
}

/**
 * Finalize all syncs before app exit
 */
export async function finalizeAllSyncs(databases: Array<{ local: any; remote: any; name: string }>): Promise<void> {
  console.log('[SyncService] Finalizing all syncs...');

  // Stop all live syncs first
  stopAllSyncs();

  // Push all changes in parallel
  await Promise.all(
    databases.map(({ local, remote, name }) =>
      pushToRemote(local, remote, name).catch((err) => {
        console.error(`[SyncService] Failed to finalize ${name}:`, err);
      })
    )
  );

  console.log('[SyncService] All syncs finalized');
}

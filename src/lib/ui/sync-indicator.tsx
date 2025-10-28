/**
 * Sync Indicator Component
 *
 * Displays real-time synchronization status for PouchDB/CouchDB
 *
 * Shows:
 * - Idle: Green checkmark (synced)
 * - Syncing: Spinning loader with direction (pull/push)
 * - Error: Red X with error message
 * - Offline: Yellow warning
 */

import { useEffect, useState } from 'react';
import type { SyncInfo } from '@/modules/shared/database/sync.service';
import { getAllSyncStatuses } from '@/modules/shared/database/sync.service';
import { Loader2, Check, X, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/ui/tooltip';
import { cn } from '@/lib/utils';

export function SyncIndicator() {
  const [syncStatuses, setSyncStatuses] = useState<Map<string, SyncInfo>>(new Map());

  useEffect(() => {
    // Initial load
    setSyncStatuses(getAllSyncStatuses());

    // Listen for sync status changes
    const handleSyncStatusChange = () => {
      setSyncStatuses(getAllSyncStatuses());
    };

    window.addEventListener('sync-status-change', handleSyncStatusChange);

    return () => {
      window.removeEventListener('sync-status-change', handleSyncStatusChange);
    };
  }, []);

  const getStatusDetails = () => {
    const statuses = Array.from(syncStatuses.entries());
    const syncingDbs = statuses.filter(([_, s]) => s.status === 'syncing');
    const errorDbs = statuses.filter(([_, s]) => s.status === 'error');
    const offlineDbs = statuses.filter(([_, s]) => s.status === 'offline');

    if (errorDbs.length > 0) {
      return {
        icon: <X className="h-4 w-4" />,
        color: 'text-red-500',
        message: `Sync error in ${errorDbs.map(([name]) => name).join(', ')}`,
        tooltip: errorDbs.map(([name, status]) => (
          <div key={name} className="mb-1">
            <span className="font-semibold">{name}:</span> {status.error?.message || 'Unknown error'}
          </div>
        )),
      };
    }

    if (syncingDbs.length > 0) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: 'text-blue-500',
        message: `Syncing ${syncingDbs.map(([name]) => name).join(', ')}`,
        tooltip: syncingDbs.map(([name, status]) => (
          <div key={name} className="mb-1">
            <span className="font-semibold">{name}:</span> {status.direction || 'syncing'}
          </div>
        )),
      };
    }

    if (offlineDbs.length > 0) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        color: 'text-yellow-500',
        message: `Offline: ${offlineDbs.map(([name]) => name).join(', ')}`,
        tooltip: <div>Some databases are offline. Changes will sync when connection is restored.</div>,
      };
    }

    return {
      icon: <Check className="h-4 w-4" />,
      color: 'text-green-500',
      message: 'All databases synced',
      tooltip: statuses.map(([name, status]) => (
        <div key={name} className="mb-1">
          <span className="font-semibold">{name}:</span> {status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'never'}
        </div>
      )),
    };
  };

  const statusDetails = getStatusDetails();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className={cn('flex items-center', statusDetails.color)}>
              {statusDetails.icon}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm">
            <div className="font-semibold mb-2">{statusDetails.message}</div>
            {statusDetails.tooltip}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

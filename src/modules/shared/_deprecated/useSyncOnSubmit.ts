/**
 * React Hook for integrating PouchDB sync with react-hook-form
 *
 * Usage:
 * ```typescript
 * const form = useForm<MyFormData>({
 *   resolver: valibotResolver(mySchema),
 * });
 *
 * const { handleSubmitWithSync } = useSyncOnSubmit('dbName', form);
 *
 * const onSubmit = handleSubmitWithSync(async (data) => {
 *   // Your form submission logic
 *   await MyService.create(data);
 * });
 * ```
 */

import { useCallback } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import { syncDatabaseOnChange } from '@/modules/shared/database/db';

export function useSyncOnSubmit<T extends FieldValues>(
  dbName: string,
  _form: UseFormReturn<T>
) {
  /**
   * Wraps a form submit handler with automatic sync to CouchDB
   *
   * @param onSubmit - Original form submission handler
   * @returns Wrapped handler that syncs after successful submission
   */
  const handleSubmitWithSync = useCallback(
    (onSubmit: (data: T) => Promise<void> | void) => {
      return async (data: T) => {
        try {
          // Execute the original submit handler
          await onSubmit(data);

          // If successful, sync to CouchDB immediately
          console.log(`[useSyncOnSubmit] Syncing ${dbName} after form submission...`);
          await syncDatabaseOnChange(dbName);
          console.log(`[useSyncOnSubmit] Sync complete for ${dbName}`);

          // Optional: Show success toast
          // toast.success('Changes synced successfully');
        } catch (error) {
          console.error(`[useSyncOnSubmit] Error during submit or sync:`, error);

          // Re-throw to let the form handle the error
          throw error;
        }
      };
    },
    [dbName]
  );

  return {
    handleSubmitWithSync,
  };
}

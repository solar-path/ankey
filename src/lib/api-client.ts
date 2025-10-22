// Simple API client placeholder
// This is no longer used since we're using PouchDB directly
// Keeping it for backward compatibility

export const client = async (_url: string, _options?: any) => {
  console.warn("API client is deprecated. Use AuthService directly.");
  return { data: null, error: new Error("Not implemented") };
};

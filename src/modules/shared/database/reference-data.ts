// Reference data utilities for Countries and Industries
// PouchDB is loaded from CDN in index.html
// Access it from the global window object
declare global {
  interface Window {
    PouchDB: any;
  }
}

const COUCHDB_URL = import.meta.env.VITE_COUCHDB_URL || 'http://127.0.0.1:5984';

// Parse CouchDB URL to extract credentials
const parseDBUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const username = urlObj.username || 'admin';
    const password = urlObj.password || '';
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    return { baseUrl, username, password };
  } catch {
    return { baseUrl: 'http://127.0.0.1:5984', username: 'admin', password: '' };
  }
};

const { baseUrl, username, password } = parseDBUrl(COUCHDB_URL);

// Debug logging
console.log('[ReferenceData] COUCHDB_URL:', COUCHDB_URL);
console.log('[ReferenceData] Parsed baseUrl:', baseUrl);
console.log('[ReferenceData] Username:', username);

// Lazy initialization of databases
let _countriesDB: any = null;
let _industriesDB: any = null;

const getCountriesDB = () => {
  if (!_countriesDB) {
    if (!window.PouchDB) {
      throw new Error('PouchDB is not loaded. Make sure PouchDB script is included in index.html');
    }
    console.log('[ReferenceData] Initializing local countries DB with sync to:', `${baseUrl}/countries`);

    // Use local database with sync to remote
    const localDB = new window.PouchDB('local_countries');
    const remoteDB = new window.PouchDB(`${baseUrl}/countries`, {
      auth: username && password ? { username, password } : undefined,
    });

    // Sync from remote to local (one-time initial sync)
    localDB.replicate.from(remoteDB, {
      batch_size: 100
    }).on('complete', (info: any) => {
      console.log('[ReferenceData] Countries sync complete:', info);
    }).on('error', (err: any) => {
      console.error('[ReferenceData] Countries sync error:', err);
    });

    _countriesDB = localDB;
  }
  return _countriesDB;
};

const getIndustriesDB = () => {
  if (!_industriesDB) {
    if (!window.PouchDB) {
      throw new Error('PouchDB is not loaded. Make sure PouchDB script is included in index.html');
    }
    console.log('[ReferenceData] Initializing local industries DB with sync to:', `${baseUrl}/industries`);

    // Use local database with sync to remote
    const localDB = new window.PouchDB('local_industries');
    const remoteDB = new window.PouchDB(`${baseUrl}/industries`, {
      auth: username && password ? { username, password } : undefined,
    });

    // Sync from remote to local (one-time initial sync)
    localDB.replicate.from(remoteDB, {
      batch_size: 100
    }).on('complete', (info: any) => {
      console.log('[ReferenceData] Industries sync complete:', info);
    }).on('error', (err: any) => {
      console.error('[ReferenceData] Industries sync error:', err);
    });

    _industriesDB = localDB;
  }
  return _industriesDB;
};

// Types
export interface Country {
  _id: string;
  _rev?: string;
  code: string;
  name: string;
  locale: string;
  language: string;
  currency: string;
  phoneCode: string;
  timezones: Array<{ name: string }>;
  type: 'country';
  importedAt: number;
}

export interface Industry {
  _id: string;
  _rev?: string;
  code: number;
  title: string;
  description: string;
  type: 'industry';
  importedAt: number;
}

// Countries API
export const countries = {
  /**
   * Get all countries
   */
  async getAll(): Promise<Country[]> {
    try {
      console.log('[ReferenceData] Getting countries...');
      const db = getCountriesDB();
      console.log('[ReferenceData] Countries DB initialized');
      const result = await db.allDocs({ include_docs: true });
      console.log('[ReferenceData] Countries loaded:', result.rows.length);
      return result.rows.map((row: any) => row.doc as Country);
    } catch (error) {
      console.error('[ReferenceData] Error loading countries:', error);
      throw error;
    }
  },

  /**
   * Get country by code (e.g., 'US', 'CA', 'GB')
   */
  async getByCode(code: string): Promise<Country | null> {
    try {
      const db = getCountriesDB();
      return (await db.get(code)) as Country;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  /**
   * Search countries by name (case insensitive)
   */
  async searchByName(query: string): Promise<Country[]> {
    const db = getCountriesDB();
    const result = await db.find({
      selector: {
        name: { $regex: new RegExp(query, 'i') },
      },
      limit: 20,
    });
    return result.docs as Country[];
  },

  /**
   * Get countries by currency
   */
  async getByCurrency(currency: string): Promise<Country[]> {
    const db = getCountriesDB();
    const result = await db.find({
      selector: {
        currency: currency,
      },
    });
    return result.docs as Country[];
  },

  /**
   * Get countries for a select/dropdown component
   */
  async getOptions(): Promise<Array<{ value: string; label: string }>> {
    const allCountries = await this.getAll();
    return allCountries.map((country) => ({
      value: country.code,
      label: country.name,
    }));
  },
};

// Industries API
export const industries = {
  /**
   * Get all industries
   */
  async getAll(): Promise<Industry[]> {
    try {
      console.log('[ReferenceData] Getting industries...');
      const db = getIndustriesDB();
      console.log('[ReferenceData] Industries DB initialized');
      const result = await db.allDocs({ include_docs: true });
      console.log('[ReferenceData] Industries loaded:', result.rows.length);
      return result.rows.map((row: any) => row.doc as Industry);
    } catch (error) {
      console.error('[ReferenceData] Error loading industries:', error);
      throw error;
    }
  },

  /**
   * Get industry by code
   */
  async getByCode(code: number): Promise<Industry | null> {
    try {
      const db = getIndustriesDB();
      return (await db.get(code.toString())) as Industry;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  /**
   * Search industries by title (case insensitive)
   */
  async searchByTitle(query: string): Promise<Industry[]> {
    const db = getIndustriesDB();
    const result = await db.find({
      selector: {
        title: { $regex: new RegExp(query, 'i') },
      },
      limit: 20,
    });
    return result.docs as Industry[];
  },

  /**
   * Search industries by description
   */
  async searchByDescription(query: string): Promise<Industry[]> {
    const db = getIndustriesDB();
    const result = await db.find({
      selector: {
        description: { $regex: new RegExp(query, 'i') },
      },
      limit: 20,
    });
    return result.docs as Industry[];
  },

  /**
   * Get industries for a select/dropdown component
   */
  async getOptions(): Promise<Array<{ value: string; label: string }>> {
    const allIndustries = await this.getAll();
    return allIndustries.map((industry) => ({
      value: industry.code.toString(),
      label: industry.title,
    }));
  },
};

// Utility functions
export const referenceData = {
  /**
   * Preload all reference data (call on app startup)
   */
  async preload() {
    await Promise.all([countries.getAll(), industries.getAll()]);
  },

  /**
   * Check if reference data is loaded
   */
  async isLoaded(): Promise<boolean> {
    try {
      const countriesDb = getCountriesDB();
      const industriesDb = getIndustriesDB();
      const [countriesInfo, industriesInfo] = await Promise.all([
        countriesDb.info(),
        industriesDb.info(),
      ]);
      return countriesInfo.doc_count > 0 && industriesInfo.doc_count > 0;
    } catch (error) {
      return false;
    }
  },
};

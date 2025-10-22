// Reference data utilities for Countries and Industries
import PouchDB from 'pouchdb';

const COUCHDB_URL = import.meta.env.VITE_COUCHDB_URL || 'http://127.0.0.1:5984';

// Initialize reference databases
export const countriesDB = new PouchDB(`${COUCHDB_URL}/countries`);
export const industriesDB = new PouchDB(`${COUCHDB_URL}/industries`);

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
    const result = await countriesDB.allDocs({ include_docs: true });
    return result.rows.map((row) => row.doc as Country);
  },

  /**
   * Get country by code (e.g., 'US', 'CA', 'GB')
   */
  async getByCode(code: string): Promise<Country | null> {
    try {
      return (await countriesDB.get(code)) as Country;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  /**
   * Search countries by name (case insensitive)
   */
  async searchByName(query: string): Promise<Country[]> {
    const result = await countriesDB.find({
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
    const result = await countriesDB.find({
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
    const result = await industriesDB.allDocs({ include_docs: true });
    return result.rows.map((row) => row.doc as Industry);
  },

  /**
   * Get industry by code
   */
  async getByCode(code: number): Promise<Industry | null> {
    try {
      return (await industriesDB.get(code.toString())) as Industry;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  /**
   * Search industries by title (case insensitive)
   */
  async searchByTitle(query: string): Promise<Industry[]> {
    const result = await industriesDB.find({
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
    const result = await industriesDB.find({
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
      const [countriesInfo, industriesInfo] = await Promise.all([
        countriesDB.info(),
        industriesDB.info(),
      ]);
      return countriesInfo.doc_count > 0 && industriesInfo.doc_count > 0;
    } catch (error) {
      return false;
    }
  },
};

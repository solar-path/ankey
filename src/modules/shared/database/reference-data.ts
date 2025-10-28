/**
 * Reference Data API (Countries and Industries)
 *
 * This module provides access to reference data from PostgreSQL via the Hono API.
 * Data is cached in memory after first load for performance.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
export interface Country {
  code: string;
  name: string;
  locale: string;
  language: string;
  currency: string;
  phone_code: string;
  timezones: Array<{ name: string }>;
}

export interface Industry {
  code: number;
  title: string;
  description: string;
}

// In-memory cache
let _countriesCache: Country[] | null = null;
let _industriesCache: Industry[] | null = null;

// Countries API
export const countries = {
  /**
   * Get all countries
   */
  async getAll(): Promise<Country[]> {
    if (_countriesCache) {
      return _countriesCache;
    }

    try {
      console.log('[ReferenceData] Fetching countries from API...');
      const response = await fetch(`${API_URL}/api/reference/countries`);
      if (!response.ok) {
        throw new Error(`Failed to fetch countries: ${response.statusText}`);
      }
      const countries = await response.json();
      _countriesCache = countries;
      console.log('[ReferenceData] Countries loaded:', countries.length);
      return countries;
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
      const response = await fetch(`${API_URL}/api/reference/countries/${code}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Failed to fetch country: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[ReferenceData] Error loading country:', error);
      throw error;
    }
  },

  /**
   * Search countries by name (case insensitive)
   */
  async searchByName(query: string): Promise<Country[]> {
    const allCountries = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return allCountries.filter(country =>
      country.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
  },

  /**
   * Get countries by currency
   */
  async getByCurrency(currency: string): Promise<Country[]> {
    const allCountries = await this.getAll();
    return allCountries.filter(country => country.currency === currency);
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

  /**
   * Clear cache (for testing or when data is updated)
   */
  clearCache() {
    _countriesCache = null;
  },
};

// Industries API
export const industries = {
  /**
   * Get all industries
   */
  async getAll(): Promise<Industry[]> {
    if (_industriesCache) {
      return _industriesCache;
    }

    try {
      console.log('[ReferenceData] Fetching industries from API...');
      const response = await fetch(`${API_URL}/api/reference/industries`);
      if (!response.ok) {
        throw new Error(`Failed to fetch industries: ${response.statusText}`);
      }
      const industries = await response.json();
      _industriesCache = industries;
      console.log('[ReferenceData] Industries loaded:', industries.length);
      return industries;
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
      const response = await fetch(`${API_URL}/api/reference/industries/${code}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Failed to fetch industry: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[ReferenceData] Error loading industry:', error);
      throw error;
    }
  },

  /**
   * Search industries by title (case insensitive)
   */
  async searchByTitle(query: string): Promise<Industry[]> {
    const allIndustries = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return allIndustries.filter(industry =>
      industry.title.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
  },

  /**
   * Search industries by description
   */
  async searchByDescription(query: string): Promise<Industry[]> {
    const allIndustries = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return allIndustries.filter(industry =>
      industry.description && industry.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
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

  /**
   * Clear cache (for testing or when data is updated)
   */
  clearCache() {
    _industriesCache = null;
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
  isLoaded(): boolean {
    return _countriesCache !== null && _industriesCache !== null;
  },

  /**
   * Clear all caches
   */
  clearCache() {
    countries.clearCache();
    industries.clearCache();
  },
};

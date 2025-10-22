/**
 * Example component showing how to use the reference data utilities
 *
 * This is just an example - you can delete this file once you understand how to use the API
 */

import { useEffect, useState } from 'react';
import { countries, industries, type Country, type Industry } from '../lib/reference-data';

export function CountrySelectExample() {
  const [countryOptions, setCountryOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    // Load country options for dropdown
    countries.getOptions().then(setCountryOptions);
  }, []);

  const handleCountryChange = async (code: string) => {
    const country = await countries.getByCode(code);
    setSelectedCountry(country);
  };

  return (
    <div>
      <h3>Select Country</h3>
      <select onChange={(e) => handleCountryChange(e.target.value)}>
        <option value="">-- Select a country --</option>
        {countryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {selectedCountry && (
        <div>
          <h4>Country Details:</h4>
          <p>Code: {selectedCountry.code}</p>
          <p>Name: {selectedCountry.name}</p>
          <p>Currency: {selectedCountry.currency}</p>
          <p>Phone Code: {selectedCountry.phoneCode}</p>
        </div>
      )}
    </div>
  );
}

export function CountrySearchExample() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Country[]>([]);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length > 1) {
      const countries = await countries.searchByName(searchQuery);
      setResults(countries);
    } else {
      setResults([]);
    }
  };

  return (
    <div>
      <h3>Search Countries</h3>
      <input
        type="text"
        placeholder="Search by country name..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {results.length > 0 && (
        <ul>
          {results.map((country) => (
            <li key={country.code}>
              {country.name} ({country.code}) - {country.currency}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function IndustrySelectExample() {
  const [industryOptions, setIndustryOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  useEffect(() => {
    // Load industry options for dropdown
    industries.getOptions().then(setIndustryOptions);
  }, []);

  const handleIndustryChange = async (code: string) => {
    const industry = await industries.getByCode(parseInt(code));
    setSelectedIndustry(industry);
  };

  return (
    <div>
      <h3>Select Industry</h3>
      <select onChange={(e) => handleIndustryChange(e.target.value)}>
        <option value="">-- Select an industry --</option>
        {industryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {selectedIndustry && (
        <div>
          <h4>Industry Details:</h4>
          <p>Code: {selectedIndustry.code}</p>
          <p>Title: {selectedIndustry.title}</p>
          <p>Description: {selectedIndustry.description}</p>
        </div>
      )}
    </div>
  );
}

export function IndustrySearchExample() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Industry[]>([]);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length > 2) {
      const industries = await industries.searchByTitle(searchQuery);
      setResults(industries);
    } else {
      setResults([]);
    }
  };

  return (
    <div>
      <h3>Search Industries</h3>
      <input
        type="text"
        placeholder="Search by industry title..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {results.length > 0 && (
        <ul>
          {results.map((industry) => (
            <li key={industry.code}>
              <strong>{industry.title}</strong>
              <br />
              <small>{industry.description}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Main example component combining all examples
export default function ReferenceDataExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Reference Data Examples</h1>

      <div style={{ marginBottom: '40px' }}>
        <CountrySelectExample />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <CountrySearchExample />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <IndustrySelectExample />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <IndustrySearchExample />
      </div>
    </div>
  );
}

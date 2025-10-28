-- ============================================
-- REFERENCE DATA MODULE - Schema Definition
-- ============================================
-- Countries and Industries reference tables
-- These tables store static reference data for the application

-- ============================================
-- COUNTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS countries (
  -- Primary key
  code TEXT PRIMARY KEY,  -- ISO 3166-1 alpha-2 code (e.g., 'US', 'GB', 'KZ')

  -- Country information
  name TEXT NOT NULL,
  locale TEXT NOT NULL,  -- Locale code (e.g., 'en_US', 'ru_RU')
  language TEXT NOT NULL,  -- Primary language code (e.g., 'en', 'ru')
  currency TEXT NOT NULL,  -- ISO 4217 currency code (e.g., 'USD', 'KZT')
  phone_code TEXT NOT NULL,  -- International dialing code (e.g., '+1', '+7')

  -- Timezones (array of timezone objects)
  timezones JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDUSTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS industries (
  -- Primary key
  code INTEGER PRIMARY KEY,

  -- Industry information
  title TEXT NOT NULL,
  description TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Countries indexes
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_currency ON countries(currency);
CREATE INDEX IF NOT EXISTS idx_countries_language ON countries(language);

-- Industries indexes
CREATE INDEX IF NOT EXISTS idx_industries_title ON industries(title);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE countries IS 'Reference data: World countries with locale, currency, and timezone information';
COMMENT ON TABLE industries IS 'Reference data: Business industry classifications';

COMMENT ON COLUMN countries.code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN countries.timezones IS 'Array of timezone objects in JSONB format';
COMMENT ON COLUMN industries.code IS 'Unique industry classification code';

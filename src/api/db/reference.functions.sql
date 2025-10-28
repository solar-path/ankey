-- ============================================
-- REFERENCE DATA MODULE - Business Logic Functions
-- ============================================
-- PostgreSQL functions for countries and industries reference data
-- All business logic resides here (PostgreSQL-centric architecture)

-- ============================================
-- CREATE SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS reference;

-- ============================================
-- COUNTRIES FUNCTIONS
-- ============================================

/**
 * Get all countries
 * Returns: JSONB array of countries
 */
CREATE OR REPLACE FUNCTION reference.get_all_countries()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'code', code,
      'name', name,
      'locale', locale,
      'language', language,
      'currency', currency,
      'phone_code', phone_code,
      'timezones', timezones
    ) ORDER BY name
  )
  INTO v_result
  FROM countries;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

/**
 * Get country by code
 * @param _code TEXT - Country code (e.g., 'US', 'GB', 'KZ')
 * Returns: JSONB object with country data or null
 */
CREATE OR REPLACE FUNCTION reference.get_country_by_code(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validation
  IF _code IS NULL OR _code = '' THEN
    RAISE EXCEPTION 'Country code is required';
  END IF;

  SELECT jsonb_build_object(
    'code', code,
    'name', name,
    'locale', locale,
    'language', language,
    'currency', currency,
    'phone_code', phone_code,
    'timezones', timezones
  )
  INTO v_result
  FROM countries
  WHERE code = UPPER(_code);

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Country not found: %', _code;
  END IF;

  RETURN v_result;
END;
$$;

/**
 * Search countries by name
 * @param _query TEXT - Search query
 * @param _limit INTEGER - Maximum results (default: 20)
 * Returns: JSONB array of matching countries
 */
CREATE OR REPLACE FUNCTION reference.search_countries(
  _query TEXT,
  _limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validation
  IF _query IS NULL OR LENGTH(_query) < 2 THEN
    RAISE EXCEPTION 'Search query must be at least 2 characters';
  END IF;

  IF _limit < 1 OR _limit > 100 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 100';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'code', code,
      'name', name,
      'locale', locale,
      'language', language,
      'currency', currency,
      'phone_code', phone_code,
      'timezones', timezones
    ) ORDER BY name
  )
  INTO v_result
  FROM (
    SELECT *
    FROM countries
    WHERE name ILIKE '%' || _query || '%'
    LIMIT _limit
  ) subquery;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ============================================
-- INDUSTRIES FUNCTIONS
-- ============================================

/**
 * Get all industries
 * Returns: JSONB array of industries
 */
CREATE OR REPLACE FUNCTION reference.get_all_industries()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'code', code,
      'title', title,
      'description', description
    ) ORDER BY title
  )
  INTO v_result
  FROM industries;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

/**
 * Get industry by code
 * @param _code INTEGER - Industry code (GICS code)
 * Returns: JSONB object with industry data or null
 */
CREATE OR REPLACE FUNCTION reference.get_industry_by_code(_code INTEGER)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validation
  IF _code IS NULL THEN
    RAISE EXCEPTION 'Industry code is required';
  END IF;

  SELECT jsonb_build_object(
    'code', code,
    'title', title,
    'description', description
  )
  INTO v_result
  FROM industries
  WHERE code = _code;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Industry not found: %', _code;
  END IF;

  RETURN v_result;
END;
$$;

/**
 * Search industries by title or description
 * @param _query TEXT - Search query
 * @param _limit INTEGER - Maximum results (default: 20)
 * Returns: JSONB array of matching industries
 */
CREATE OR REPLACE FUNCTION reference.search_industries(
  _query TEXT,
  _limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validation
  IF _query IS NULL OR LENGTH(_query) < 2 THEN
    RAISE EXCEPTION 'Search query must be at least 2 characters';
  END IF;

  IF _limit < 1 OR _limit > 100 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 100';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'code', code,
      'title', title,
      'description', description
    ) ORDER BY title
  )
  INTO v_result
  FROM (
    SELECT *
    FROM industries
    WHERE title ILIKE '%' || _query || '%'
       OR description ILIKE '%' || _query || '%'
    LIMIT _limit
  ) subquery;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

/**
 * Get countries options for dropdowns
 * Returns: JSONB array of {value, label} objects
 */
CREATE OR REPLACE FUNCTION reference.get_countries_options()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'value', code,
      'label', name
    ) ORDER BY name
  )
  INTO v_result
  FROM countries;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

/**
 * Get industries options for dropdowns
 * Returns: JSONB array of {value, label} objects
 */
CREATE OR REPLACE FUNCTION reference.get_industries_options()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'value', code::TEXT,
      'label', title
    ) ORDER BY title
  )
  INTO v_result
  FROM industries;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_countries_name_search ON countries USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_industries_title_search ON industries USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_industries_description_search ON industries USING gin(to_tsvector('english', description));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION reference.get_all_countries IS 'Get all countries in JSONB format';
COMMENT ON FUNCTION reference.get_country_by_code IS 'Get country by ISO code';
COMMENT ON FUNCTION reference.search_countries IS 'Search countries by name with limit';
COMMENT ON FUNCTION reference.get_all_industries IS 'Get all industries in JSONB format';
COMMENT ON FUNCTION reference.get_industry_by_code IS 'Get industry by GICS code';
COMMENT ON FUNCTION reference.search_industries IS 'Search industries by title or description';
COMMENT ON FUNCTION reference.get_countries_options IS 'Get countries as dropdown options';
COMMENT ON FUNCTION reference.get_industries_options IS 'Get industries as dropdown options';

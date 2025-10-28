-- ============================================
-- INQUIRY MODULE - Schema Definition
-- ============================================
-- Схема для модуля обращений/контактов

CREATE SCHEMA IF NOT EXISTS inquiry;

-- ============================================
-- INQUIRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
  -- Dual-key system
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL,  -- Format: inquiry_<timestamp>_<short_uuid>

  -- Document type
  type TEXT NOT NULL DEFAULT 'inquiry' CHECK (type = 'inquiry'),

  -- Contact information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,

  -- Inquiry details
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::JSONB,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'responded', 'closed', 'spam')),
  response TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

  -- NOTE: Используется audit.log для детального отслеживания изменений
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inquiries_id ON inquiries(id);
CREATE INDEX IF NOT EXISTS idx_inquiries_text_id ON inquiries(_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inquiries_updated_at ON inquiries;
CREATE TRIGGER trigger_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA inquiry IS 'Contact form and inquiry management module';
COMMENT ON TABLE inquiries IS 'Contact form submissions and inquiries';

COMMENT ON COLUMN inquiries.id IS 'UUID primary key for efficient JOINs';
COMMENT ON COLUMN inquiries._id IS 'Text ID for compatibility (format: inquiry_<timestamp>_<short_uuid>)';
COMMENT ON COLUMN inquiries.attachments IS 'Array of attachment URLs in JSONB format';
COMMENT ON COLUMN inquiries.status IS 'Inquiry status: pending, in_progress, responded, closed, spam';

-- ============================================
-- DATABASE SCHEMA FOR AUTH MODULE
-- ============================================
-- PostgreSQL schema для модуля аутентификации
-- Совместимо с существующей структурой PouchDB/CouchDB

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  _id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'user' CHECK (type = 'user'),

  -- Основные данные
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  fullname TEXT NOT NULL,

  -- Верификация
  verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,

  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,

  -- Приглашения
  invitation_token TEXT,
  invitation_expiry BIGINT,

  -- Восстановление пароля
  reset_token TEXT,
  reset_token_expiry BIGINT,

  -- Дополнительная информация (JSONB для гибкости)
  profile JSONB DEFAULT '{}'::JSONB,

  -- Временные метки (в миллисекундах, как в PouchDB)
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Таблица сессий
CREATE TABLE IF NOT EXISTS sessions (
  _id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'session' CHECK (type = 'session'),

  -- Связь с пользователем
  user_id TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,

  -- Токен сессии
  token TEXT NOT NULL UNIQUE,

  -- Истечение (в миллисекундах)
  expires_at BIGINT NOT NULL,

  -- Временная метка создания
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Таблица компаний (для мультитенантности)
CREATE TABLE IF NOT EXISTS companies (
  _id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'company' CHECK (type = 'company'),

  -- Основные данные
  title TEXT NOT NULL,
  industry TEXT,

  -- Дополнительная информация
  data JSONB DEFAULT '{}'::JSONB,

  -- Временные метки
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Таблица связей пользователь-компания
CREATE TABLE IF NOT EXISTS user_companies (
  _id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'user_company' CHECK (type = 'user_company'),

  -- Связи
  user_id TEXT NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(_id) ON DELETE CASCADE,

  -- Роль пользователя в компании
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  -- Временная метка создания
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,

  -- Уникальность: один пользователь - одна роль в компании
  UNIQUE(user_id, company_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE type = 'user';
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_code)
  WHERE verification_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_invitation ON users(invitation_token)
  WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset ON users(reset_token)
  WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token) WHERE type = 'session';
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id) WHERE type = 'session';
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at) WHERE type = 'session';

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_title ON companies(title);
CREATE INDEX IF NOT EXISTS idx_companies_created ON companies(created_at DESC);

-- User-companies indexes
CREATE INDEX IF NOT EXISTS idx_user_companies_user ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_role ON user_companies(role);

-- ============================================
-- TRIGGERS
-- ============================================

-- Автоматическое обновление updated_at для users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Функция для автоматической очистки истекших сессий
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions
  WHERE expires_at < (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Функция для генерации уникального ID (совместимо с PouchDB)
CREATE OR REPLACE FUNCTION generate_id(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql AS $$
BEGIN
  RETURN prefix || '_' ||
         (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT || '_' ||
         gen_random_uuid()::TEXT;
END;
$$;

-- ============================================
-- SCHEDULED JOBS (требует pg_cron extension)
-- ============================================

-- Автоматическая очистка истекших сессий каждый час
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Таблица пользователей системы';
COMMENT ON COLUMN users._id IS 'Уникальный идентификатор (совместимо с PouchDB)';
COMMENT ON COLUMN users.type IS 'Тип документа (для совместимости с PouchDB)';
COMMENT ON COLUMN users.profile IS 'Дополнительная информация профиля в формате JSONB';
COMMENT ON COLUMN users.created_at IS 'Временная метка создания в миллисекундах';
COMMENT ON COLUMN users.updated_at IS 'Временная метка обновления в миллисекундах';

COMMENT ON TABLE sessions IS 'Таблица активных сессий пользователей';
COMMENT ON COLUMN sessions.expires_at IS 'Время истечения сессии в миллисекундах';

COMMENT ON TABLE companies IS 'Таблица компаний для мультитенантности';

COMMENT ON TABLE user_companies IS 'Связь пользователей с компаниями и их ролями';
COMMENT ON COLUMN user_companies.role IS 'Роль: owner (владелец), admin (администратор), member (участник)';

-- ============================================
-- SAMPLE DATA (для development)
-- ============================================

-- Создать тестового пользователя (пароль: password123)
-- INSERT INTO users (_id, email, password, fullname, verified)
-- VALUES (
--   generate_id('user'),
--   'test@example.com',
--   encode(digest('password123', 'sha256'), 'hex'),
--   'Test User',
--   TRUE
-- );

-- ============================================
-- MIGRATION HELPERS
-- ============================================

-- Функция для миграции данных из PouchDB/CouchDB
CREATE OR REPLACE FUNCTION migrate_from_pouchdb(
  doc JSONB
)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  -- Определить тип документа и вставить в соответствующую таблицу
  CASE doc->>'type'
    WHEN 'user' THEN
      INSERT INTO users (
        _id, type, email, password, fullname, verified,
        verification_code, two_factor_enabled, two_factor_secret,
        profile, created_at, updated_at
      ) VALUES (
        doc->>'_id',
        doc->>'type',
        doc->>'email',
        doc->>'password',
        doc->>'fullname',
        (doc->>'verified')::BOOLEAN,
        doc->>'verificationCode',
        (doc->>'twoFactorEnabled')::BOOLEAN,
        doc->>'twoFactorSecret',
        COALESCE(doc->'profile', '{}'::JSONB),
        (doc->>'createdAt')::BIGINT,
        (doc->>'updatedAt')::BIGINT
      ) ON CONFLICT (_id) DO NOTHING;

    WHEN 'session' THEN
      INSERT INTO sessions (
        _id, type, user_id, token, expires_at, created_at
      ) VALUES (
        doc->>'_id',
        doc->>'type',
        doc->>'userId',
        doc->>'token',
        (doc->>'expiresAt')::BIGINT,
        (doc->>'createdAt')::BIGINT
      ) ON CONFLICT (_id) DO NOTHING;

    WHEN 'company' THEN
      INSERT INTO companies (
        _id, type, title, industry, created_at, updated_at
      ) VALUES (
        doc->>'_id',
        doc->>'type',
        doc->>'title',
        doc->>'industry',
        (doc->>'createdAt')::BIGINT,
        (doc->>'updatedAt')::BIGINT
      ) ON CONFLICT (_id) DO NOTHING;

    WHEN 'user_company' THEN
      INSERT INTO user_companies (
        _id, type, user_id, company_id, role, created_at
      ) VALUES (
        doc->>'_id',
        doc->>'type',
        doc->>'userId',
        doc->>'companyId',
        doc->>'role',
        (doc->>'createdAt')::BIGINT
      ) ON CONFLICT (_id) DO NOTHING;

    ELSE
      RAISE NOTICE 'Unknown document type: %', doc->>'type';
  END CASE;
END;
$$;

-- ============================================
-- SECURITY
-- ============================================

-- Row Level Security (RLS) будет настроен отдельно
-- после внедрения всех функций из auth.sql

-- Пример политики RLS (раскомментировать после настройки)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY users_select_own ON users
--   FOR SELECT
--   USING (_id = current_setting('app.current_user_id', true));
--
-- CREATE POLICY users_update_own ON users
--   FOR UPDATE
--   USING (_id = current_setting('app.current_user_id', true));

-- ============================================
-- STATISTICS
-- ============================================

-- Обновить статистику для оптимизатора запросов
ANALYZE users;
ANALYZE sessions;
ANALYZE companies;
ANALYZE user_companies;

-- MesterX Ultra v6 — License Management Schema
-- PostgreSQL 16+

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE license_tier AS ENUM ('starter', 'professional', 'enterprise', 'unlimited');
CREATE TYPE license_status AS ENUM ('active', 'expired', 'suspended', 'trial');

-- ============================================================
-- LICENSE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS licenses (
    id            SERIAL PRIMARY KEY,
    company_id    INTEGER NOT NULL,
    license_key   VARCHAR(64) NOT NULL UNIQUE,
    tier          license_tier NOT NULL DEFAULT 'starter',
    status        license_status NOT NULL DEFAULT 'trial',
    max_users     INTEGER DEFAULT 5,
    max_branches  INTEGER DEFAULT 1,
    issued_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMP,
    activated_at  TIMESTAMP,
    notes         TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS licenses_company_idx ON licenses (company_id);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON licenses (status);
CREATE INDEX IF NOT EXISTS licenses_expires_at_idx ON licenses (expires_at);

-- ----

CREATE TABLE IF NOT EXISTS license_audit_log (
    id          SERIAL PRIMARY KEY,
    license_id  INTEGER NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    company_id  INTEGER NOT NULL,
    action      VARCHAR(100) NOT NULL,
    details     TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_license_idx ON license_audit_log (license_id);
CREATE INDEX IF NOT EXISTS audit_company_idx ON license_audit_log (company_id);
CREATE INDEX IF NOT EXISTS audit_created_at_idx ON license_audit_log (created_at DESC);

-- ============================================================
-- TRIGGER — auto-update updated_at on licenses
-- ============================================================

CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_licenses_updated_at
    BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_licenses_updated_at();

-- ============================================================
-- SEED: Trial license for platform company
-- ============================================================

INSERT INTO licenses (company_id, license_key, tier, status, max_users, max_branches, activated_at)
VALUES (
    1,
    'MX-PLATFORM-UNLIMITED-0000',
    'unlimited',
    'active',
    9999,
    9999,
    NOW()
)
ON CONFLICT (license_key) DO NOTHING;

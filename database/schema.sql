-- MesterX Ultra v6 — Core Database Schema
-- PostgreSQL 16+
-- Generated from Drizzle ORM schema definitions

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE company_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE branch_status AS ENUM ('active', 'inactive');
CREATE TYPE user_role AS ENUM ('platform_admin', 'company_admin', 'manager', 'employee');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE module_name AS ENUM ('pos', 'commerce', 'inventory', 'hr', 'finance', 'crm', 'delivery', 'analytics');
CREATE TYPE product_status AS ENUM ('active', 'inactive');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'on_leave');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE customer_status AS ENUM ('active', 'inactive');

-- ============================================================
-- CORE SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    phone       VARCHAR(20),
    address     TEXT,
    city        VARCHAR(100),
    country     VARCHAR(100),
    status      company_status DEFAULT 'active',
    metadata    JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS companies_status_idx ON companies (status);

-- ----

CREATE TABLE IF NOT EXISTS branches (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    address     TEXT,
    city        VARCHAR(100),
    phone       VARCHAR(20),
    status      branch_status DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS branches_company_idx ON branches (company_id);

-- ----

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id   INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    role        user_role DEFAULT 'employee',
    status      user_status DEFAULT 'active',
    last_login  TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (email, company_id)
);

CREATE INDEX IF NOT EXISTS users_company_idx ON users (company_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- ----

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS roles_company_idx ON roles (company_id);

-- ----

CREATE TABLE IF NOT EXISTS feature_flags (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module      module_name NOT NULL,
    is_enabled  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, module)
);

CREATE INDEX IF NOT EXISTS feature_flags_company_idx ON feature_flags (company_id);

-- ============================================================
-- COMMERCE SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id   INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    sku         VARCHAR(100) NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL,
    cost        NUMERIC(10, 2),
    category    VARCHAR(100),
    status      product_status DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (sku, company_id)
);

CREATE INDEX IF NOT EXISTS products_company_idx ON products (company_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);

-- ----

CREATE TABLE IF NOT EXISTS orders (
    id            SERIAL PRIMARY KEY,
    company_id    INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id     INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    customer_id   INTEGER,
    order_number  VARCHAR(50) NOT NULL,
    total_amount  NUMERIC(10, 2) NOT NULL,
    status        order_status DEFAULT 'pending',
    notes         TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (order_number, company_id)
);

CREATE INDEX IF NOT EXISTS orders_company_idx ON orders (company_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

-- ============================================================
-- INVENTORY SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
    id                SERIAL PRIMARY KEY,
    company_id        INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id         INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity          INTEGER NOT NULL DEFAULT 0,
    reorder_level     INTEGER DEFAULT 10,
    last_restock_date TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, product_id, branch_id)
);

CREATE INDEX IF NOT EXISTS inventory_company_idx ON inventory (company_id);
CREATE INDEX IF NOT EXISTS inventory_product_idx ON inventory (product_id);

-- ============================================================
-- HR SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id   INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    position    VARCHAR(100),
    department  VARCHAR(100),
    salary      NUMERIC(10, 2),
    status      employee_status DEFAULT 'active',
    hire_date   TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS employees_company_idx ON employees (company_id);
CREATE INDEX IF NOT EXISTS employees_department_idx ON employees (department);

-- ============================================================
-- FINANCE SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id       INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    invoice_number  VARCHAR(50) NOT NULL,
    customer_id     INTEGER,
    amount          NUMERIC(10, 2) NOT NULL,
    status          invoice_status DEFAULT 'draft',
    due_date        TIMESTAMP,
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (invoice_number, company_id)
);

CREATE INDEX IF NOT EXISTS invoices_company_idx ON invoices (company_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON invoices (due_date);

-- ============================================================
-- CRM SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
    id           SERIAL PRIMARY KEY,
    company_id   INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id    INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255),
    phone        VARCHAR(20),
    address      TEXT,
    city         VARCHAR(100),
    total_orders INTEGER DEFAULT 0,
    total_spent  NUMERIC(12, 2) DEFAULT 0,
    status       customer_status DEFAULT 'active',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_company_idx ON customers (company_id);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers (email);

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'companies', 'branches', 'users', 'roles', 'feature_flags',
        'products', 'orders', 'inventory', 'employees', 'invoices', 'customers'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER update_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            t, t
        );
    END LOOP;
END;
$$;

-- ============================================================
-- SEED: Platform admin company + user
-- ============================================================

INSERT INTO companies (name, email, status)
VALUES ('MesterX Platform', 'platform@mesterx.com', 'active')
ON CONFLICT (email) DO NOTHING;

-- Password: Admin@MesterX2025! (bcrypt hash, cost 12)
INSERT INTO users (company_id, email, password, first_name, last_name, role, status)
SELECT
    c.id,
    'mahmoudtohamy44@gmail.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMnMnMnMnMnMnMnMnMnMnMnM',
    'Platform',
    'Admin',
    'platform_admin',
    'active'
FROM companies c
WHERE c.email = 'platform@mesterx.com'
ON CONFLICT DO NOTHING;

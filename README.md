# MesterX Ultra v6 — AI-Powered Business Operating System

A production-ready multi-tenant SaaS platform built with Node.js, tRPC, React, and PostgreSQL.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Nginx (Port 80)                   │
│              Reverse proxy + Rate limiting               │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  Frontend   │        │     API     │
    │  React/Vite │        │  Express +  │
    │  Port 3000  │        │    tRPC     │
    └─────────────┘        │  Port 5000  │
                           └──────┬──────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
       ┌──────▼──────┐   ┌────────▼──────┐   ┌───────▼──────┐
       │ PostgreSQL  │   │     Redis     │   │ License API  │
       │   Port 5432 │   │   Port 6379   │   │  Port 5001   │
       └─────────────┘   └───────────────┘   └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| API | Node.js, Express, tRPC v10 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| Testing | Vitest |
| Container | Docker + Docker Compose |

## Database Schema (6 Domains)

| Domain | Tables |
|--------|--------|
| **Core** | companies, branches, users, roles, feature_flags |
| **Commerce** | products, orders |
| **Inventory** | inventory |
| **HR** | employees |
| **Finance** | invoices |
| **CRM** | customers |

## Quick Start

### With Docker Compose (recommended)

```bash
docker compose up -d
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **License API**: http://localhost:5001
- **Nginx**: http://localhost:80

### Local Development

**Backend:**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://mesterx:mesterxpass123@localhost:5432/mesterxdb
JWT_SECRET=your-64-char-minimum-secret-key
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

## API Endpoints

All API calls go through tRPC at `/trpc`. Available routers:

| Router | Procedures |
|--------|-----------|
| `auth` | register, login, me, changePassword |
| `company` | list, get, getMyCompany, create, update, listBranches, createBranch |
| `product` | list, get, create, update, delete |
| `order` | list, get, create, updateStatus, delete |
| `employee` | list, get, create, update, delete |
| `customer` | list, get, create, update, delete |
| `invoice` | list, get, create, updateStatus |
| `inventory` | list, upsert, adjust |
| `featureFlag` | list, toggle, isEnabled |

## RBAC (Role-Based Access Control)

| Role | Access Level |
|------|-------------|
| `platform_admin` | Full access to all companies and data |
| `company_admin` | Full access to their own company |
| `manager` | Read/write access, no admin operations |
| `employee` | Read access to their company data |

## Feature Flags

Modules can be enabled/disabled per company:

- `pos` — Point of Sale
- `commerce` — Online store & orders
- `inventory` — Stock management
- `hr` — Human resources
- `finance` — Invoicing & accounting
- `crm` — Customer relationships
- `delivery` — Logistics & delivery
- `analytics` — Business intelligence

## Testing

```bash
cd backend
npm test
```

29+ tests covering:
- Auth (JWT, bcrypt)
- Schema validation (all 11 tables)
- tRPC procedure types
- Input validation (Zod schemas)
- RBAC enforcement
- Feature flag logic

## Platform Credentials

| Field | Value |
|-------|-------|
| Email | mahmoudtohamy44@gmail.com |
| Password | Admin@MesterX2025! |
| Role | platform_admin |

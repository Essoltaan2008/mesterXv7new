import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const licenseTierEnum = pgEnum('license_tier', ['starter', 'professional', 'enterprise', 'unlimited']);
export const licenseStatusEnum = pgEnum('license_status', ['active', 'expired', 'suspended', 'trial']);

export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  licenseKey: varchar('license_key', { length: 64 }).notNull().unique(),
  tier: licenseTierEnum('tier').notNull().default('starter'),
  status: licenseStatusEnum('status').notNull().default('trial'),
  maxUsers: integer('max_users').default(5),
  maxBranches: integer('max_branches').default(1),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  activatedAt: timestamp('activated_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('licenses_company_idx').on(table.companyId),
  keyIdx: uniqueIndex('licenses_key_idx').on(table.licenseKey),
  statusIdx: index('licenses_status_idx').on(table.status),
}));

export const licenseAuditLog = pgTable('license_audit_log', {
  id: serial('id').primaryKey(),
  licenseId: integer('license_id').notNull(),
  companyId: integer('company_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  licenseIdx: index('audit_license_idx').on(table.licenseId),
  companyIdx: index('audit_company_idx').on(table.companyId),
}));

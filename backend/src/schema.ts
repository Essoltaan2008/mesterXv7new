import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  pgEnum,
  json,
  numeric,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ ENUMS ============
export const companyStatusEnum = pgEnum('company_status', ['active', 'inactive', 'suspended']);
export const branchStatusEnum = pgEnum('branch_status', ['active', 'inactive']);
export const userRoleEnum = pgEnum('user_role', ['platform_admin', 'company_admin', 'manager', 'employee']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);
export const moduleEnum = pgEnum('module_name', ['pos', 'commerce', 'inventory', 'hr', 'finance', 'crm', 'delivery', 'analytics']);
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'inactive', 'on_leave']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export const customerStatusEnum = pgEnum('customer_status', ['active', 'inactive']);

// ============ CORE SCHEMA ============

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  status: companyStatusEnum('status').default('active'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('companies_status_idx').on(table.status),
}));

export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  status: branchStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('branches_company_idx').on(table.companyId),
}));

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum('role').default('employee'),
  status: userStatusEnum('status').default('active'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('users_company_idx').on(table.companyId),
  emailCompanyIdx: uniqueIndex('users_email_company_idx').on(table.email, table.companyId),
}));

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  permissions: json('permissions').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('roles_company_idx').on(table.companyId),
}));

export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  module: moduleEnum('module').notNull(),
  isEnabled: boolean('is_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyModuleIdx: uniqueIndex('feature_flags_company_module_idx').on(table.companyId, table.module),
}));

// ============ COMMERCE SCHEMA ============

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }),
  category: varchar('category', { length: 100 }),
  status: productStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('products_company_idx').on(table.companyId),
  skuCompanyIdx: uniqueIndex('products_sku_company_idx').on(table.sku, table.companyId),
}));

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  customerId: integer('customer_id'),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('orders_company_idx').on(table.companyId),
  statusIdx: index('orders_status_idx').on(table.status),
  orderNumberCompanyIdx: uniqueIndex('orders_number_company_idx').on(table.orderNumber, table.companyId),
}));

// ============ INVENTORY SCHEMA ============

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  reorderLevel: integer('reorder_level').default(10),
  lastRestockDate: timestamp('last_restock_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyProductIdx: uniqueIndex('inventory_company_product_idx').on(table.companyId, table.productId, table.branchId),
}));

// ============ HR SCHEMA ============

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  position: varchar('position', { length: 100 }),
  department: varchar('department', { length: 100 }),
  salary: numeric('salary', { precision: 10, scale: 2 }),
  status: employeeStatusEnum('status').default('active'),
  hireDate: timestamp('hire_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('employees_company_idx').on(table.companyId),
  emailCompanyIdx: index('employees_email_company_idx').on(table.email, table.companyId),
}));

// ============ FINANCE SCHEMA ============

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  customerId: integer('customer_id'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').default('draft'),
  dueDate: timestamp('due_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('invoices_company_idx').on(table.companyId),
  statusIdx: index('invoices_status_idx').on(table.status),
  invoiceNumberCompanyIdx: uniqueIndex('invoices_number_company_idx').on(table.invoiceNumber, table.companyId),
}));

// ============ CRM SCHEMA ============

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  totalOrders: integer('total_orders').default(0),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 }).default('0'),
  status: customerStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('customers_company_idx').on(table.companyId),
  emailCompanyIdx: index('customers_email_company_idx').on(table.email, table.companyId),
}));

// ============ RELATIONS ============

export const companiesRelations = relations(companies, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
  featureFlags: many(featureFlags),
  products: many(products),
  orders: many(orders),
  employees: many(employees),
  invoices: many(invoices),
  customers: many(customers),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  company: one(companies, { fields: [branches.companyId], references: [companies.id] }),
  users: many(users),
  employees: many(employees),
}));

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  company: one(companies, { fields: [products.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [products.branchId], references: [branches.id] }),
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  company: one(companies, { fields: [inventory.companyId], references: [companies.id] }),
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  company: one(companies, { fields: [employees.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [employees.branchId], references: [branches.id] }),
  user: one(users, { fields: [employees.userId], references: [users.id] }),
}));

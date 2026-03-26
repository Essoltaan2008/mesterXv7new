import { describe, it, expect } from 'vitest';
import {
  companies,
  branches,
  users,
  roles,
  featureFlags,
  products,
  orders,
  inventory,
  employees,
  invoices,
  customers,
} from '../schema.js';

describe('Database Schema', () => {
  describe('Core Schema Tables', () => {
    it('should define companies table with required columns', () => {
      expect(companies).toBeDefined();
      const columns = Object.keys(companies);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
    });

    it('should define branches table with companyId foreign key', () => {
      expect(branches).toBeDefined();
      const columns = Object.keys(branches);
      expect(columns).toContain('companyId');
    });

    it('should define users table with role column', () => {
      expect(users).toBeDefined();
      const columns = Object.keys(users);
      expect(columns).toContain('role');
      expect(columns).toContain('email');
      expect(columns).toContain('password');
    });

    it('should define roles table with permissions column', () => {
      expect(roles).toBeDefined();
      const columns = Object.keys(roles);
      expect(columns).toContain('permissions');
    });

    it('should define featureFlags table with module column', () => {
      expect(featureFlags).toBeDefined();
      const columns = Object.keys(featureFlags);
      expect(columns).toContain('module');
      expect(columns).toContain('isEnabled');
    });
  });

  describe('Commerce Schema Tables', () => {
    it('should define products table with price and sku', () => {
      expect(products).toBeDefined();
      const columns = Object.keys(products);
      expect(columns).toContain('price');
      expect(columns).toContain('sku');
    });

    it('should define orders table with status and totalAmount', () => {
      expect(orders).toBeDefined();
      const columns = Object.keys(orders);
      expect(columns).toContain('status');
      expect(columns).toContain('totalAmount');
      expect(columns).toContain('orderNumber');
    });
  });

  describe('Inventory Schema Tables', () => {
    it('should define inventory table with quantity and reorderLevel', () => {
      expect(inventory).toBeDefined();
      const columns = Object.keys(inventory);
      expect(columns).toContain('quantity');
      expect(columns).toContain('reorderLevel');
      expect(columns).toContain('productId');
    });
  });

  describe('HR Schema Tables', () => {
    it('should define employees table with salary and department', () => {
      expect(employees).toBeDefined();
      const columns = Object.keys(employees);
      expect(columns).toContain('salary');
      expect(columns).toContain('department');
      expect(columns).toContain('position');
    });
  });

  describe('Finance Schema Tables', () => {
    it('should define invoices table with amount and dueDate', () => {
      expect(invoices).toBeDefined();
      const columns = Object.keys(invoices);
      expect(columns).toContain('amount');
      expect(columns).toContain('dueDate');
      expect(columns).toContain('invoiceNumber');
    });
  });

  describe('CRM Schema Tables', () => {
    it('should define customers table with contact fields', () => {
      expect(customers).toBeDefined();
      const columns = Object.keys(customers);
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('phone');
    });

    it('should define customers table with analytics fields', () => {
      const columns = Object.keys(customers);
      expect(columns).toContain('totalOrders');
      expect(columns).toContain('totalSpent');
    });
  });

  describe('Table Count', () => {
    it('should have all 11 tables defined', () => {
      const tables = [
        companies, branches, users, roles, featureFlags,
        products, orders, inventory, employees, invoices, customers,
      ];
      expect(tables).toHaveLength(11);
      tables.forEach(table => expect(table).toBeDefined());
    });
  });
});

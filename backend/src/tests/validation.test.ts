import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Shared validation schemas (mirrors what routers use)
const emailSchema = z.string().email();
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
});

const productSchema = z.object({
  companyId: z.number(),
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.string(),
  cost: z.string().optional(),
  category: z.string().optional(),
});

const orderSchema = z.object({
  companyId: z.number(),
  orderNumber: z.string().min(1),
  totalAmount: z.string(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
});

const featureFlagSchema = z.object({
  companyId: z.number(),
  module: z.enum(['pos', 'commerce', 'inventory', 'hr', 'finance', 'crm', 'delivery', 'analytics']),
  isEnabled: z.boolean(),
});

describe('Input Validation Schemas', () => {
  describe('Auth validation', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Acme Corp',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Acme Corp',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Acme Corp',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject empty firstName', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'SecurePass123',
        firstName: '',
        lastName: 'Doe',
        companyName: 'Acme Corp',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Product validation', () => {
    it('should accept valid product data', () => {
      const result = productSchema.safeParse({
        companyId: 1,
        name: 'Widget Pro',
        sku: 'WGT-001',
        price: '29.99',
        category: 'Electronics',
      });
      expect(result.success).toBe(true);
    });

    it('should reject product without SKU', () => {
      const result = productSchema.safeParse({
        companyId: 1,
        name: 'Widget Pro',
        sku: '',
        price: '29.99',
      });
      expect(result.success).toBe(false);
    });

    it('should accept product without optional fields', () => {
      const result = productSchema.safeParse({
        companyId: 1,
        name: 'Basic Widget',
        sku: 'WGT-002',
        price: '9.99',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Order validation', () => {
    it('should accept valid order data', () => {
      const result = orderSchema.safeParse({
        companyId: 1,
        orderNumber: 'ORD-2024-001',
        totalAmount: '150.00',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid order status', () => {
      const result = orderSchema.safeParse({
        companyId: 1,
        orderNumber: 'ORD-001',
        totalAmount: '100.00',
        status: 'invalid_status',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid order statuses', () => {
      const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
      statuses.forEach(status => {
        const result = orderSchema.safeParse({
          companyId: 1,
          orderNumber: 'ORD-001',
          totalAmount: '100.00',
          status,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Feature flag validation', () => {
    it('should accept valid feature flag toggle', () => {
      const result = featureFlagSchema.safeParse({
        companyId: 1,
        module: 'inventory',
        isEnabled: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid module name', () => {
      const result = featureFlagSchema.safeParse({
        companyId: 1,
        module: 'unknown_module',
        isEnabled: true,
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid module names', () => {
      const modules = ['pos', 'commerce', 'inventory', 'hr', 'finance', 'crm', 'delivery', 'analytics'] as const;
      modules.forEach(module => {
        const result = featureFlagSchema.safeParse({
          companyId: 1,
          module,
          isEnabled: false,
        });
        expect(result.success).toBe(true);
      });
    });
  });
});

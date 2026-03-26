import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Module definitions
const MODULES = ['pos', 'commerce', 'inventory', 'hr', 'finance', 'crm', 'delivery', 'analytics'] as const;
type Module = typeof MODULES[number];

interface FeatureFlag {
  companyId: number;
  module: Module;
  isEnabled: boolean;
}

// Simulate feature flag store
class FeatureFlagStore {
  private flags: Map<string, boolean> = new Map();

  private key(companyId: number, module: Module): string {
    return `${companyId}:${module}`;
  }

  set(companyId: number, module: Module, isEnabled: boolean): void {
    this.flags.set(this.key(companyId, module), isEnabled);
  }

  get(companyId: number, module: Module): boolean {
    return this.flags.get(this.key(companyId, module)) ?? false;
  }

  getAll(companyId: number): FeatureFlag[] {
    return MODULES.map(module => ({
      companyId,
      module,
      isEnabled: this.get(companyId, module),
    }));
  }
}

describe('Feature Flags', () => {
  describe('Module definitions', () => {
    it('should define exactly 8 modules', () => {
      expect(MODULES).toHaveLength(8);
    });

    it('should include all required business modules', () => {
      expect(MODULES).toContain('pos');
      expect(MODULES).toContain('commerce');
      expect(MODULES).toContain('inventory');
      expect(MODULES).toContain('hr');
      expect(MODULES).toContain('finance');
      expect(MODULES).toContain('crm');
      expect(MODULES).toContain('delivery');
      expect(MODULES).toContain('analytics');
    });
  });

  describe('FeatureFlagStore', () => {
    it('should default to disabled for unknown flags', () => {
      const store = new FeatureFlagStore();
      expect(store.get(1, 'pos')).toBe(false);
    });

    it('should enable a module', () => {
      const store = new FeatureFlagStore();
      store.set(1, 'inventory', true);
      expect(store.get(1, 'inventory')).toBe(true);
    });

    it('should disable a previously enabled module', () => {
      const store = new FeatureFlagStore();
      store.set(1, 'crm', true);
      store.set(1, 'crm', false);
      expect(store.get(1, 'crm')).toBe(false);
    });

    it('should isolate flags between companies', () => {
      const store = new FeatureFlagStore();
      store.set(1, 'hr', true);
      store.set(2, 'hr', false);
      expect(store.get(1, 'hr')).toBe(true);
      expect(store.get(2, 'hr')).toBe(false);
    });

    it('should return all 8 modules for a company', () => {
      const store = new FeatureFlagStore();
      const flags = store.getAll(1);
      expect(flags).toHaveLength(8);
    });

    it('should return correct enabled state in getAll', () => {
      const store = new FeatureFlagStore();
      store.set(1, 'finance', true);
      store.set(1, 'analytics', true);
      const flags = store.getAll(1);
      const financeFlag = flags.find(f => f.module === 'finance');
      const analyticsFlag = flags.find(f => f.module === 'analytics');
      const posFlag = flags.find(f => f.module === 'pos');
      expect(financeFlag?.isEnabled).toBe(true);
      expect(analyticsFlag?.isEnabled).toBe(true);
      expect(posFlag?.isEnabled).toBe(false);
    });
  });

  describe('Zod validation for module enum', () => {
    const moduleSchema = z.enum(MODULES);

    it('should accept valid module names', () => {
      MODULES.forEach(module => {
        expect(moduleSchema.safeParse(module).success).toBe(true);
      });
    });

    it('should reject invalid module names', () => {
      const invalid = ['billing', 'reports', 'unknown', ''];
      invalid.forEach(name => {
        expect(moduleSchema.safeParse(name).success).toBe(false);
      });
    });
  });
});

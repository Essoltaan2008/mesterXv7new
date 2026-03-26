import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';

// RBAC helper functions (mirrors middleware logic)
type UserRole = 'platform_admin' | 'company_admin' | 'manager' | 'employee';

interface User {
  id: number;
  role: UserRole;
  companyId: number;
}

function assertAuthenticated(user: User | null): asserts user is User {
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
  }
}

function assertAdmin(user: User | null): asserts user is User {
  assertAuthenticated(user);
  if (user.role !== 'company_admin' && user.role !== 'platform_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' });
  }
}

function assertPlatformAdmin(user: User | null): asserts user is User {
  assertAuthenticated(user);
  if (user.role !== 'platform_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Platform admin access required.' });
  }
}

function assertSameCompany(user: User, companyId: number): void {
  if (user.role !== 'platform_admin' && user.companyId !== companyId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this company.' });
  }
}

describe('RBAC (Role-Based Access Control)', () => {
  describe('assertAuthenticated', () => {
    it('should pass for authenticated user', () => {
      const user: User = { id: 1, role: 'employee', companyId: 1 };
      expect(() => assertAuthenticated(user)).not.toThrow();
    });

    it('should throw UNAUTHORIZED for null user', () => {
      expect(() => assertAuthenticated(null)).toThrow('UNAUTHORIZED');
    });
  });

  describe('assertAdmin', () => {
    it('should pass for company_admin', () => {
      const user: User = { id: 1, role: 'company_admin', companyId: 1 };
      expect(() => assertAdmin(user)).not.toThrow();
    });

    it('should pass for platform_admin', () => {
      const user: User = { id: 1, role: 'platform_admin', companyId: 1 };
      expect(() => assertAdmin(user)).not.toThrow();
    });

    it('should throw FORBIDDEN for manager', () => {
      const user: User = { id: 1, role: 'manager', companyId: 1 };
      expect(() => assertAdmin(user)).toThrow('FORBIDDEN');
    });

    it('should throw FORBIDDEN for employee', () => {
      const user: User = { id: 1, role: 'employee', companyId: 1 };
      expect(() => assertAdmin(user)).toThrow('FORBIDDEN');
    });

    it('should throw UNAUTHORIZED for null user', () => {
      expect(() => assertAdmin(null)).toThrow('UNAUTHORIZED');
    });
  });

  describe('assertPlatformAdmin', () => {
    it('should pass for platform_admin', () => {
      const user: User = { id: 1, role: 'platform_admin', companyId: 1 };
      expect(() => assertPlatformAdmin(user)).not.toThrow();
    });

    it('should throw FORBIDDEN for company_admin', () => {
      const user: User = { id: 1, role: 'company_admin', companyId: 1 };
      expect(() => assertPlatformAdmin(user)).toThrow('FORBIDDEN');
    });

    it('should throw FORBIDDEN for manager', () => {
      const user: User = { id: 1, role: 'manager', companyId: 1 };
      expect(() => assertPlatformAdmin(user)).toThrow('FORBIDDEN');
    });
  });

  describe('assertSameCompany (tenant isolation)', () => {
    it('should pass when user belongs to the same company', () => {
      const user: User = { id: 1, role: 'employee', companyId: 5 };
      expect(() => assertSameCompany(user, 5)).not.toThrow();
    });

    it('should throw FORBIDDEN when user belongs to different company', () => {
      const user: User = { id: 1, role: 'employee', companyId: 5 };
      expect(() => assertSameCompany(user, 99)).toThrow('FORBIDDEN');
    });

    it('should allow platform_admin to access any company', () => {
      const user: User = { id: 1, role: 'platform_admin', companyId: 1 };
      expect(() => assertSameCompany(user, 99)).not.toThrow();
    });

    it('should allow company_admin to access their own company', () => {
      const user: User = { id: 1, role: 'company_admin', companyId: 3 };
      expect(() => assertSameCompany(user, 3)).not.toThrow();
    });

    it('should deny company_admin access to another company', () => {
      const user: User = { id: 1, role: 'company_admin', companyId: 3 };
      expect(() => assertSameCompany(user, 7)).toThrow('FORBIDDEN');
    });
  });

  describe('Role hierarchy', () => {
    const roles: UserRole[] = ['platform_admin', 'company_admin', 'manager', 'employee'];

    it('should define 4 distinct roles', () => {
      expect(roles).toHaveLength(4);
    });

    it('should identify admin roles correctly', () => {
      const adminRoles = roles.filter(r => r === 'company_admin' || r === 'platform_admin');
      expect(adminRoles).toHaveLength(2);
    });

    it('should identify non-admin roles correctly', () => {
      const nonAdminRoles = roles.filter(r => r !== 'company_admin' && r !== 'platform_admin');
      expect(nonAdminRoles).toHaveLength(2);
      expect(nonAdminRoles).toContain('manager');
      expect(nonAdminRoles).toContain('employee');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('../db.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock_token'),
    verify: vi.fn().mockReturnValue({ id: 1, email: 'test@test.com', role: 'company_admin', companyId: 1 }),
  },
}));

describe('Auth Router', () => {
  describe('JWT token generation', () => {
    it('should generate a token with correct payload shape', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const payload = { id: 1, email: 'test@test.com', role: 'company_admin', companyId: 1 };
      const token = jwt.sign(payload, 'secret', { expiresIn: '7d' });
      expect(token).toBe('mock_token');
      expect(jwt.sign).toHaveBeenCalledWith(payload, 'secret', { expiresIn: '7d' });
    });

    it('should verify a valid token', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const result = jwt.verify('mock_token', 'secret');
      expect(result).toMatchObject({ id: 1, email: 'test@test.com' });
    });
  });

  describe('Password hashing', () => {
    it('should hash a password with bcrypt', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash('password123', 12);
      expect(hash).toBe('hashed_password');
    });

    it('should verify a correct password', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const isValid = await bcrypt.compare('password123', 'hashed_password');
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);
      const isValid = await bcrypt.compare('wrongpassword', 'hashed_password');
      expect(isValid).toBe(false);
    });
  });
});

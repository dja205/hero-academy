import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, generateAccessToken, verifyAccessToken } from './auth';
import { Role } from '@hero-academy/shared';

describe('auth service', () => {
  // -----------------------------------------------------------------------
  // Password hashing
  // -----------------------------------------------------------------------

  describe('hashPassword', () => {
    it('returns a bcrypt hash', () => {
      const hash = hashPassword('secret123');
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt prefix
      expect(hash).not.toBe('secret123');
    });
  });

  describe('comparePassword', () => {
    it('returns true for correct password', () => {
      const hash = hashPassword('correct-password');
      expect(comparePassword('correct-password', hash)).toBe(true);
    });

    it('returns false for wrong password', () => {
      const hash = hashPassword('correct-password');
      expect(comparePassword('wrong-password', hash)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // PIN hashing (uses same bcrypt functions)
  // -----------------------------------------------------------------------

  describe('PIN hashing via hashPassword/comparePassword', () => {
    it('hashPassword hashes a 4-digit PIN', () => {
      const hash = hashPassword('1234');
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('comparePassword returns true for correct PIN', () => {
      const hash = hashPassword('5678');
      expect(comparePassword('5678', hash)).toBe(true);
    });

    it('comparePassword returns false for wrong PIN', () => {
      const hash = hashPassword('5678');
      expect(comparePassword('0000', hash)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // JWT token generation
  // -----------------------------------------------------------------------

  describe('generateAccessToken', () => {
    it('returns an object with a valid JWT structure (3 dot-separated parts)', () => {
      const token = generateAccessToken({ sub: 'user-1', role: Role.Parent });
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('round-trips through verifyAccessToken', () => {
      const payload = { sub: 'user-2', role: Role.Admin };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.sub).toBe('user-2');
      expect(decoded.role).toBe(Role.Admin);
    });

    it('includes parentId when provided', () => {
      const token = generateAccessToken({
        sub: 'child-1',
        role: Role.Child,
        parentId: 'parent-1',
      });
      const decoded = verifyAccessToken(token);
      expect(decoded.parentId).toBe('parent-1');
    });
  });
});

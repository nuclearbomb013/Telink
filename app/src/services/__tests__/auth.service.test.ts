import { describe, it, expect } from 'vitest';
import { authService } from '@/services/auth.service';

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    const result = authService.validatePassword('short');
    expect(result.isValid).toBe(false);
  });

  it('rejects passwords with too few character types', () => {
    const result = authService.validatePassword('12345678');
    expect(result.isValid).toBe(false);
  });

  it('accepts strong passwords', () => {
    const result = authService.validatePassword('MyPassword1!');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
  });

  it('returns strength levels based on complexity', () => {
    const weak = authService.validatePassword('abcdefgh');
    const strong = authService.validatePassword('MyPass123!');
    expect(weak.strength).toBe('weak');
    expect(strong.strength).toBe('strong');
  });

  it('returns errors array', () => {
    const result = authService.validatePassword('a');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateUsername', () => {
  it('rejects empty username', () => {
    const result = authService.validateUsername('');
    expect(result.isValid).toBe(false);
  });

  it('rejects short username (less than 3 chars)', () => {
    const result = authService.validateUsername('ab');
    expect(result.isValid).toBe(false);
  });

  it('rejects too long username (> 20 chars)', () => {
    const result = authService.validateUsername('a'.repeat(25));
    expect(result.isValid).toBe(false);
  });

  it('accepts valid ASCII username', () => {
    const result = authService.validateUsername('john_doe');
    expect(result.isValid).toBe(true);
  });

  it('accepts Chinese username', () => {
    const result = authService.validateUsername('管理员');
    expect(result.isValid).toBe(true);
  });

  it('rejects username with special characters', () => {
    const result = authService.validateUsername('hello!world');
    expect(result.isValid).toBe(false);
  });
});

describe('validateEmail', () => {
  it('rejects empty email', () => {
    const result = authService.validateEmail('');
    expect(result.isValid).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = authService.validateEmail('not-an-email');
    expect(result.isValid).toBe(false);
  });

  it('rejects email without domain', () => {
    const result = authService.validateEmail('user@');
    expect(result.isValid).toBe(false);
  });

  it('accepts valid email', () => {
    const result = authService.validateEmail('user@example.com');
    expect(result.isValid).toBe(true);
  });

  it('accepts email with subdomain', () => {
    const result = authService.validateEmail('user@mail.example.com');
    expect(result.isValid).toBe(true);
  });
});

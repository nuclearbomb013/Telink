import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  it('handles tailwind conflicts', () => {
    const result = cn('px-4', 'px-2');
    expect(result).toContain('px-2');
    expect(result).not.toContain('px-4');
  });

  it('handles falsy values', () => {
    const result = cn('base', false as unknown as string, 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('false');
  });

  it('handles undefined and null', () => {
    const result = cn('base', undefined, null, 'extra');
    expect(result).toContain('base');
    expect(result).toContain('extra');
  });

  it('returns empty string for no input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

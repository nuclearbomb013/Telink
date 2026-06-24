import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatRelativeTime,
  formatShortRelativeTime,
  formatDate,
  formatTime,
  formatDateTime,
  calculateReadingTime,
} from '@/lib/dateUtils';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "刚刚" for recent times', () => {
    const result = formatRelativeTime(Date.now() - 30_000);
    expect(result).toBe('刚刚');
  });

  it('returns minutes ago', () => {
    const result = formatRelativeTime(Date.now() - 5 * 60 * 1000);
    expect(result).toContain('分钟前');
  });

  it('returns hours ago', () => {
    const result = formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000);
    expect(result).toContain('小时前');
  });

  it('returns days ago', () => {
    const result = formatRelativeTime(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(result).toContain('天前');
  });

  it('returns weeks ago', () => {
    const result = formatRelativeTime(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(result).toContain('周前');
  });

  it('returns months ago', () => {
    const result = formatRelativeTime(Date.now() - 40 * 24 * 60 * 60 * 1000);
    expect(result).toContain('个月前');
  });

  it('returns formatted date for future timestamps', () => {
    const futureDate = new Date('2027-01-15T12:00:00').getTime();
    const result = formatRelativeTime(futureDate);
    expect(result).toContain('2027');
  });
});

describe('formatShortRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only shows to day level', () => {
    const result = formatShortRelativeTime(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(result).toContain('天前');
    expect(result).not.toContain('周前');
    expect(result).not.toContain('个月前');
  });
});

describe('formatDate', () => {
  const timestamp = new Date('2026-06-08T12:00:00').getTime();

  it('formats as short (YYYY-MM-DD)', () => {
    expect(formatDate(timestamp, 'short')).toBe('2026-06-08');
  });

  it('formats as long (YYYY年M月D日)', () => {
    expect(formatDate(timestamp, 'long')).toBe('2026年6月8日');
  });

  it('formats as full (YYYY年M月D日 HH:mm)', () => {
    const result = formatDate(timestamp, 'full');
    expect(result).toMatch(/2026年6月8日 \d{2}:\d{2}/);
  });

  it('defaults to long format', () => {
    expect(formatDate(timestamp)).toBe('2026年6月8日');
  });
});

describe('formatTime', () => {
  it('formats time with padding', () => {
    const timestamp = new Date('2026-01-01T01:02:00').getTime();
    expect(formatTime(timestamp)).toBe('01:02');
  });

  it('formats double digit time', () => {
    const timestamp = new Date('2026-01-01T12:30:00').getTime();
    expect(formatTime(timestamp)).toBe('12:30');
  });
});

describe('formatDateTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows time only for today', () => {
    const timestamp = new Date('2026-06-08T08:30:00').getTime();
    expect(formatDateTime(timestamp)).toMatch(/^\d{2}:\d{2}$/);
  });

  it('shows month-day for this year', () => {
    const timestamp = new Date('2026-03-15T12:00:00').getTime();
    expect(formatDateTime(timestamp)).toBe('3月15日');
  });

  it('shows full date for other years', () => {
    const timestamp = new Date('2025-12-25T12:00:00').getTime();
    expect(formatDateTime(timestamp)).toBe('2025-12-25');
  });
});

describe('calculateReadingTime', () => {
  it('returns 0 for empty text', () => {
    expect(calculateReadingTime('')).toBe(0);
  });

  it('calculates reading time for Chinese text', () => {
    const text = '测试'.repeat(300);
    const result = calculateReadingTime(text);
    expect(result).toBeGreaterThan(0);
  });

  it('calculates reading time for English text', () => {
    const text = 'word '.repeat(300);
    const result = calculateReadingTime(text);
    expect(result).toBeGreaterThan(0);
  });

  it('returns 1 for very short text', () => {
    expect(calculateReadingTime('Hello World')).toBe(1);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { simpleSearch, highlightMatch, debounce } from '@/lib/search';

describe('simpleSearch', () => {
  const posts = [
    { id: 1, title: 'React Hooks 教程', content: '学习 React Hooks 的最佳实践', tags: ['react', 'hooks'] },
    { id: 2, title: 'TypeScript 入门', content: 'TypeScript 基础教程', tags: ['typescript'] },
    { id: 3, title: 'Rust 内存安全', content: 'Rust 所有权系统详解', tags: ['rust', '内存'] },
  ];

  it('returns all items when query is empty', () => {
    const results = simpleSearch(posts, '', ['title', 'content']);
    expect(results.length).toBe(3);
  });

  it('finds exact match by title', () => {
    const results = simpleSearch(posts, 'React', ['title', 'content']);
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe(1);
    expect(results[0].score).toBeGreaterThan(0.8);
  });

  it('finds fuzzy match', () => {
    const results = simpleSearch(posts, 'Rust', ['title', 'content']);
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe(3);
  });

  it('sorts by relevance score', () => {
    const results = simpleSearch(posts, '教程', ['title', 'content']);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].score).toBeGreaterThanOrEqual(0);
    // Results should be sorted descending by score
    for (let i = 1; i < results.length; i++) {
      expect((results[i - 1].score ?? 0)).toBeGreaterThanOrEqual((results[i].score ?? 0));
    }
  });

  it('finds matches in arrays like tags', () => {
    const results = simpleSearch(posts, 'typescript', ['title', 'tags']);
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe(2);
  });

  it('returns empty for no matches', () => {
    const results = simpleSearch(posts, 'python', ['title', 'content', 'tags']);
    expect(results.length).toBe(0);
  });

  it('respects case sensitivity option', () => {
    const results = simpleSearch(posts, 'react', ['title'], { caseSensitive: true });
    // No match because title has 'React' (uppercase R)
    expect(results.length).toBe(0);
  });

  it('finds matches by partial Chinese word', () => {
    const results = simpleSearch(posts, '内存', ['tags']);
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe(3);
  });
});

describe('highlightMatch', () => {
  it('returns escaped html when query is empty', () => {
    const result = highlightMatch('Hello World', '');
    expect(result).toBe('Hello World');
  });

  it('wraps matched text in mark tags', () => {
    const result = highlightMatch('Hello World', 'World');
    expect(result).toContain('<mark');
    expect(result).toContain('World');
    expect(result).toContain('</mark>');
  });

  it('escapes HTML in input', () => {
    const result = highlightMatch('<script>alert("xss")</script>', 'script');
    expect(result).not.toContain('<script>');
  });

  it('highlights multiple words', () => {
    const result = highlightMatch('React Hooks 教程', 'React 教程');
    // Both 'React' and '教程' should be highlighted
    const markCount = (result.match(/<mark/g) || []).length;
    expect(markCount).toBe(2);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('only calls function once with rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

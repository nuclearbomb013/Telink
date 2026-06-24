import { describe, expect, it } from 'vitest';
import { applyEditorAction } from '@/components/articleEditorTransforms';

describe('applyEditorAction headings', () => {
  it('turns selected text into an H1 heading', () => {
    const result = applyEditorAction('Intro title', { start: 0, end: 11 }, 'h1');
    expect(result.value).toBe('# Intro title');
  });

  it('changes an existing heading level without duplicating markers', () => {
    const result = applyEditorAction('## Existing title', { start: 4, end: 12 }, 'h1');
    expect(result.value).toBe('# Existing title');
  });

  it('applies heading markers to multiple selected lines', () => {
    const result = applyEditorAction('First\nSecond', { start: 0, end: 12 }, 'h2');
    expect(result.value).toBe('## First\n## Second');
  });
});

describe('applyEditorAction inline wrappers', () => {
  it('wraps selected text in bold markers', () => {
    const result = applyEditorAction('make bold', { start: 5, end: 9 }, 'bold');
    expect(result.value).toBe('make **bold**');
    expect(result.selectionStart).toBe(7);
    expect(result.selectionEnd).toBe(11);
  });

  it('unwraps selected bold text when toggled again', () => {
    const result = applyEditorAction('make **bold**', { start: 5, end: 13 }, 'bold');
    expect(result.value).toBe('make bold');
  });

  it('inserts a selectable inline code placeholder at the cursor', () => {
    const result = applyEditorAction('value: ', { start: 7, end: 7 }, 'inline-code');
    expect(result.value).toBe('value: `code`');
    expect(result.selectionStart).toBe(8);
    expect(result.selectionEnd).toBe(12);
  });
});

describe('applyEditorAction block transforms', () => {
  it('converts selected lines to an ordered list', () => {
    const result = applyEditorAction('Alpha\nBeta', { start: 0, end: 10 }, 'ol');
    expect(result.value).toBe('1. Alpha\n2. Beta');
  });

  it('wraps selected code in a TypeScript fenced block', () => {
    const result = applyEditorAction('const x = 1;', { start: 0, end: 12 }, 'code-block');
    expect(result.value).toBe('\n```ts\nconst x = 1;\n```\n');
  });
});

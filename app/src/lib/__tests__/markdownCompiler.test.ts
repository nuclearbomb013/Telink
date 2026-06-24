import { describe, expect, it } from 'vitest';
import { compileMarkdown } from '@/lib/markdownCompiler';

describe('compileMarkdown error handling', () => {
  it('returns empty toc and zero reading time for empty string', () => {
    const result = compileMarkdown('');
    expect(result.toc).toEqual([]);
    expect(result.readingTime).toBe(0);
    expect(result.html).toContain('暂无内容');
    expect(result.summary).toEqual({ lead: '', keyPoints: [], sectionTitles: [] });
  });

  it('returns empty toc for whitespace only', () => {
    const result = compileMarkdown('   \n  ');
    expect(result.toc).toEqual([]);
  });
});

describe('compileMarkdown headings and toc', () => {
  it('generates TOC for all heading levels', () => {
    const result = compileMarkdown('# H1\n## H2\n### H3\n#### H4');
    expect(result.toc).toHaveLength(4);
    expect(result.toc[0]).toMatchObject({ level: 1 });
    expect(result.toc[1]).toMatchObject({ level: 2 });
  });

  it('generates stable IDs for English headings', () => {
    const a = compileMarkdown('# Hello World\n## Another');
    const b = compileMarkdown('# Hello World\n## Another');
    expect(a.toc[0].id).toBe(b.toc[0].id);
    expect(a.toc[1].id).toBe(b.toc[1].id);
  });

  it('handles duplicate headings with unique IDs', () => {
    const result = compileMarkdown('# Same\n# Same\n# Same');
    expect(result.toc).toHaveLength(3);
    const ids = result.toc.map(item => item.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('handles CJK headings', () => {
    const result = compileMarkdown('# 技术交流\n## 深度学习');
    expect(result.toc).toHaveLength(2);
    expect(result.toc[0].id).toContain('技术交流');
  });

  it('strips markdown from TOC text', () => {
    const result = compileMarkdown('# **Bold** and *italic*');
    expect(result.toc[0].text).toBe('Bold and italic');
  });

  it('adds heading anchors to HTML', () => {
    const result = compileMarkdown('# Test');
    expect(result.html).toContain('heading-anchor');
    expect(result.html).toContain('id="test"');
    expect(result.html).not.toContain('aria-hidden="true"');
  });

  it('extracts section titles into summary', () => {
    const result = compileMarkdown('# Intro\n\nA summary paragraph long enough to keep.\n\n## Section One\n\n## Section Two');
    expect(result.summary.sectionTitles).toEqual(['Intro', 'Section One', 'Section Two']);
  });
});

describe('compileMarkdown code blocks', () => {
  it('wraps code blocks with header', () => {
    const result = compileMarkdown('```js\nconst x = 1;\n```');
    expect(result.html).toContain('code-block-wrapper');
    expect(result.html).toContain('code-block-header');
    expect(result.html).toContain('code-block-body');
    expect(result.html).toContain('code-line-numbers');
    expect(result.html).toContain('data-native-scroll="true"');
    expect(result.html).toContain('copy-code-btn');
    expect(result.html).toContain('code-wrap-btn');
  });

  it('generates visible line numbers for code blocks', () => {
    const result = compileMarkdown('```ts\nconst a = 1;\nconst b = 2;\n```');
    expect(result.html).toContain('code-line-numbers');
    expect(result.html).toContain('>1</span>');
    expect(result.html).toContain('>2</span>');
  });

  it('preserves code content in the code element', () => {
    const result = compileMarkdown('```python\nprint("hello")\n```');
    expect(result.html).toContain('print');
    expect(result.html).toContain('python');
  });

  it('handles code without language specifier', () => {
    const result = compileMarkdown('```\nplain text\n```');
    expect(result.html).toContain('code-block-wrapper');
  });

  it('preserves highlight.js span tags', () => {
    const result = compileMarkdown('```js\nconst x = 1;\n```');
    expect(result.html).toContain('<span');
  });
});

describe('compileMarkdown tables', () => {
  it('wraps tables in scroll container', () => {
    const result = compileMarkdown('| A | B |\n|---|---|\n| 1 | 2 |');
    expect(result.html).toContain('table-scroll-wrapper');
  });
});

describe('compileMarkdown LaTeX', () => {
  it('renders inline LaTeX formulas', () => {
    const result = compileMarkdown('Inline math: $E = mc^2$.');
    expect(result.html).toContain('katex');
    expect(result.html).toContain('mathnormal');
  });

  it('renders block LaTeX formulas', () => {
    const result = compileMarkdown('$$\n\\int_0^1 x^2 dx\n$$');
    expect(result.html).toContain('katex-display');
  });

  it('does not throw on invalid LaTeX formulas', () => {
    expect(() => compileMarkdown('$\\notacommand{$')).not.toThrow();
  });
});

describe('compileMarkdown links', () => {
  it('adds rel and target to external links', () => {
    const result = compileMarkdown('[External](https://example.com/page)');
    expect(result.html).toContain('noopener noreferrer');
    expect(result.html).toContain('_blank');
  });

  it('adds external-link class', () => {
    const result = compileMarkdown('[Link](https://example.com)');
    expect(result.html).toContain('external-link');
  });
});

describe('compileMarkdown images', () => {
  it('adds viewer and accessibility attributes to images', () => {
    const result = compileMarkdown('![caption](https://example.com/img.jpg)');
    expect(result.html).toContain('data-viewer="true"');
    expect(result.html).toContain('loading="lazy"');
    expect(result.html).toContain('tabindex="0"');
    expect(result.html).toContain('role="button"');
  });

  it('handles images without alt text', () => {
    const result = compileMarkdown('![](https://example.com/img.jpg)');
    expect(result.html).toContain('data-viewer="true"');
  });
});

describe('compileMarkdown sanitization', () => {
  it('removes script tags', () => {
    const result = compileMarkdown('<script>alert("xss")</script>');
    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('alert');
  });

  it('removes onerror handlers', () => {
    const result = compileMarkdown('<img src=x onerror="alert(1)">');
    expect(result.html).not.toContain('onerror');
  });

  it('preserves safe elements like details and summary', () => {
    const result = compileMarkdown('<details><summary>Click</summary>Content</details>');
    expect(result.html).toContain('<details>');
    expect(result.html).toContain('<summary>');
  });

  it('handles SVG in markdown safely', () => {
    const result = compileMarkdown('<svg onload="alert(1)"></svg>');
    expect(result.html).not.toContain('<svg');
  });
});

describe('compileMarkdown reading helpers', () => {
  it('returns reading time for content', () => {
    const result = compileMarkdown('Hello world. '.repeat(100));
    expect(result.readingTime).toBeGreaterThan(0);
  });

  it('handles CJK content in reading time', () => {
    const result = compileMarkdown('测试中文内容。'.repeat(50));
    expect(result.readingTime).toBeGreaterThan(0);
  });

  it('extracts lead and key points for report-style reading helpers', () => {
    const result = compileMarkdown([
      '# Report',
      '',
      'This is the first paragraph for the executive summary and it is definitely long enough to be useful.',
      '',
      '- First key point for readers',
      '- Second key point for readers',
      '- Third key point for readers',
    ].join('\n'));

    expect(result.summary.lead).toContain('executive summary');
    expect(result.summary.keyPoints).toHaveLength(3);
    expect(result.summary.keyPoints[0]).toContain('First key point');
  });
});

describe('compileMarkdown idempotency', () => {
  it('produces identical output for identical input', () => {
    const markdown = '# Title\n\n```js\nconst x = 1;\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |';
    const a = compileMarkdown(markdown);
    const b = compileMarkdown(markdown);
    expect(a.html).toBe(b.html);
    expect(a.toc).toEqual(b.toc);
    expect(a.readingTime).toBe(b.readingTime);
    expect(a.summary).toEqual(b.summary);
  });
});

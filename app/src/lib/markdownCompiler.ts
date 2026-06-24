import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import markedKatex from 'marked-katex-extension';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml';
import shell from 'highlight.js/lib/languages/shell';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import ini from 'highlight.js/lib/languages/ini';
import plaintext from 'highlight.js/lib/languages/plaintext';
import diff from 'highlight.js/lib/languages/diff';
import DOMPurify from 'dompurify';
import type { MarkdownDocument, MarkdownSummary, TOCItem } from '@/services/reader.types';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('java', java);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xhtml', xml);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('console', shell);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('docker', dockerfile);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('toml', ini);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);
hljs.registerLanguage('txt', plaintext);
hljs.registerLanguage('diff', diff);

const EMPTY_SUMMARY: MarkdownSummary = {
  lead: '',
  keyPoints: [],
  sectionTitles: [],
};

const markedInstance = new Marked(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
    output: 'html',
  }),
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      if (!lang || !hljs.getLanguage(lang)) return code;
      return hljs.highlight(code, { language: lang }).value;
    },
  }),
);

markedInstance.setOptions({ breaks: true, gfm: true });

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'caption', 'colgroup', 'col',
    'em', 'strong', 'del', 'ins', 'sub', 'sup',
    'a', 'img', 'span', 'div',
    'details', 'summary', 'figure', 'figcaption',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height', 'loading',
    'class', 'id',
    'tabindex', 'role', 'aria-label', 'aria-hidden',
    'data-viewer', 'data-caption', 'data-index', 'data-native-scroll',
  ],
  ADD_ATTR: ['target'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  FORBID_TAGS: ['svg', 'math', 'style', 'script', 'button', 'input', 'label', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onmouseenter', 'oninput', 'onchange', 'onsubmit', 'onpointerdown', 'ontoggle', 'onanimationstart', 'style'],
  USE_PROFILES: { html: true },
};

function sanitize(html: string): string {
  try {
    const result = DOMPurify.sanitize(html, PURIFY_CONFIG);
    return typeof result === 'string' ? result : String(result);
  } catch (error) {
    console.error('DOMPurify failed:', error);
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function summarizeText(text: string, maxLength: number): string {
  const normalized = normalizeText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function makeHeadingId(text: string, fallbackIdx: number): string {
  const cleaned = text.replace(/<[^>]+>/g, '').trim().toLowerCase();
  const slug = cleaned
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `heading-${fallbackIdx}`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`#]+/g, '')
    .trim();
}

function calcReadingTime(text: string): number {
  if (!text) return 0;
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  const codeLines = codeBlocks.reduce((sum, block) => {
    const body = block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '');
    return sum + Math.max(1, body.split('\n').length);
  }, 0);
  const prose = text.replace(/```[\s\S]*?```/g, ' ');
  const cjk = (prose.match(/[\u4e00-\u9fff]/g) || []).length;
  const en = (prose.match(/[a-zA-Z]+/g) || []).length;
  return Math.max(1, Math.ceil((cjk + en) / 300 + codeLines / 25));
}

function parseMarkdown(content: string): string {
  if (!content?.trim()) return '';
  try {
    return String(markedInstance.parse(content) as string);
  } catch (error) {
    console.error('Markdown parse error:', error);
    return `<p>渲染失败：${(error as Error).message}</p>`;
  }
}

function detectLang(codeEl: Element): string {
  const aliasMap: Record<string, string> = {
    js: 'js',
    ts: 'ts',
    py: 'python',
    sh: 'bash',
    golang: 'go',
    rs: 'rust',
    yml: 'yaml',
    md: 'markdown',
    html: 'html',
    xhtml: 'html',
    console: 'shell',
    docker: 'dockerfile',
    toml: 'ini',
    text: 'text',
    txt: 'text',
  };
  for (const cls of codeEl.classList) {
    if (cls.startsWith('language-')) {
      const raw = cls.slice(9);
      return aliasMap[raw] || raw;
    }
  }
  return '';
}

function buildCodeHeader(doc: Document, lang: string): HTMLDivElement {
  const header = doc.createElement('div');
  header.className = 'code-block-header';

  const langSpan = doc.createElement('span');
  langSpan.className = 'code-language';
  langSpan.textContent = lang || '';
  header.appendChild(langSpan);

  const tools = doc.createElement('div');
  tools.className = 'code-block-tools';

  const wrapBtn = doc.createElement('button');
  wrapBtn.className = 'code-wrap-btn';
  wrapBtn.type = 'button';
  wrapBtn.setAttribute('aria-pressed', 'false');
  wrapBtn.setAttribute('aria-label', 'Toggle code wrapping');
  wrapBtn.textContent = 'Wrap';
  wrapBtn.textContent = '换行';
  wrapBtn.textContent = 'Wrap';
  tools.appendChild(wrapBtn);

  const copyBtn = doc.createElement('button');
  copyBtn.className = 'copy-code-btn';
  copyBtn.type = 'button';
  copyBtn.setAttribute('aria-label', 'Copy code');
  copyBtn.textContent = 'Copy';
  copyBtn.textContent = '复制';
  copyBtn.textContent = 'Copy';
  tools.appendChild(copyBtn);

  header.appendChild(tools);
  return header;
}

function buildCodeLineNumbers(doc: Document, code: string): HTMLDivElement {
  const lineNumbers = doc.createElement('div');
  lineNumbers.className = 'code-line-numbers';
  lineNumbers.setAttribute('aria-hidden', 'true');

  const normalized = code.endsWith('\n') ? code.slice(0, -1) : code;
  const lineCount = Math.max(1, normalized.split('\n').length);

  for (let i = 1; i <= lineCount; i += 1) {
    const line = doc.createElement('span');
    line.textContent = String(i);
    lineNumbers.appendChild(line);
  }

  return lineNumbers;
}

function wrapElement(parent: Element, wrapperClass: string): HTMLElement {
  const doc = parent.ownerDocument || document;
  const wrapper = doc.createElement('div');
  wrapper.className = wrapperClass;
  parent.parentNode?.insertBefore(wrapper, parent);
  wrapper.appendChild(parent);
  return wrapper;
}

function processDom(doc: Document): TOCItem[] {
  const toc: TOCItem[] = [];
  const usedIds = new Map<string, number>();
  let headingIdx = 0;

  const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
  for (const heading of headings) {
    headingIdx += 1;
    const level = parseInt(heading.tagName[1], 10);
    const text = stripMarkdown(heading.innerHTML);
    const seed = makeHeadingId(text, headingIdx);
    const count = usedIds.get(seed) || 0;
    const id = count > 0 ? `${seed}-${count + 1}` : seed;
    usedIds.set(seed, count + 1);

    heading.id = id;
    toc.push({ id, text, level });

    const anchor = doc.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${id}`;
    anchor.setAttribute('aria-label', `Heading link: ${text}`);
    anchor.textContent = '#';
    heading.insertBefore(anchor, heading.firstChild);
  }

  // Mark code blocks — buttons injected post-sanitize in injectCodeBlockButtons()
  for (const pre of doc.querySelectorAll('pre')) {
    const code = pre.querySelector('code') as HTMLElement | null;
    if (!code) continue;

    if (!code.classList.contains('hljs')) {
      code.classList.add('hljs');
    }
    // Wrap pre in code-block-wrapper div (safe, no buttons yet)
    const wrapper = doc.createElement('div');
    wrapper.className = 'code-block-wrapper';
    const body = doc.createElement('div');
    body.className = 'code-block-body';
    body.setAttribute('data-native-scroll', 'true');
    const lineNumbers = buildCodeLineNumbers(doc, code.textContent || '');

    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(body);
    body.appendChild(lineNumbers);
    body.appendChild(pre);
  }

  for (const table of doc.querySelectorAll('table')) {
    if (!table.closest('.table-scroll-wrapper')) {
      wrapElement(table, 'table-scroll-wrapper');
    }
  }

  for (const link of doc.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('http') || href.startsWith('//')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.classList.add('external-link');
    }
  }

  let imgIdx = 0;
  for (const img of doc.querySelectorAll('img')) {
    img.setAttribute('data-viewer', 'true');
    img.setAttribute('data-caption', img.getAttribute('alt') || '');
    img.setAttribute('data-index', String(imgIdx++));
    img.setAttribute('loading', 'lazy');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `查看图片：${img.getAttribute('alt') || '无描述'}`);
  }

  return toc;
}

function buildSummary(root: HTMLElement, toc: TOCItem[]): MarkdownSummary {
  const paragraphs = Array.from(root.querySelectorAll('p'))
    .map(node => normalizeText(node.textContent || ''))
    .filter(text => text.length >= 24);

  const listItems = Array.from(root.querySelectorAll('li'))
    .map(node => normalizeText(node.textContent || ''))
    .filter(text => text.length >= 12);

  const leadSource = paragraphs[0] || listItems[0] || '';
  const keyPointsSource = (listItems.length > 0 ? listItems : paragraphs)
    .filter(text => text !== leadSource)
    .slice(0, 3);

  return {
    lead: summarizeText(leadSource, 140),
    keyPoints: keyPointsSource.map(point => summarizeText(point, 72)),
    sectionTitles: toc
      .filter(item => item.level <= 2)
      .slice(0, 4)
      .map(item => item.text),
  };
}

function fallbackDocument(html: string, content: string): MarkdownDocument {
  return {
    html,
    toc: [],
    readingTime: calcReadingTime(content),
    summary: {
      lead: summarizeText(content, 140),
      keyPoints: [],
      sectionTitles: [],
    },
  };
}

/**
 * Inject code-block headers (language label + copy/wrap buttons) into sanitized HTML.
 * This runs AFTER sanitization so user-submitted HTML cannot inject buttons.
 */
function injectCodeBlockButtons(html: string): string {
  if (typeof window === 'undefined' || !html.includes('code-block-wrapper')) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="inject-root">${html}</div>`, 'text/html');
    const root = doc.getElementById('inject-root');
    if (!root) return html;

    for (const wrapper of root.querySelectorAll('.code-block-wrapper')) {
      // Skip if header already exists
      if (wrapper.querySelector('.code-block-header')) continue;

      const body = wrapper.querySelector('.code-block-body');
      const pre = body?.querySelector('pre') || wrapper.querySelector('pre');
      const code = pre?.querySelector('code') as HTMLElement | null;
      if (!code) continue;

      const lang = detectLang(code);
      const header = buildCodeHeader(doc, lang);
      wrapper.insertBefore(header, wrapper.firstChild);
    }

    return root.innerHTML;
  } catch {
    return html;
  }
}

export function compileMarkdown(content: string): MarkdownDocument {
  if (!content?.trim()) {
    return {
      html: '<p>暂无内容</p>',
      toc: [],
      readingTime: 0,
      summary: EMPTY_SUMMARY,
    };
  }

  const rawHtml = parseMarkdown(content);
  if (!rawHtml) {
    return {
      html: '<p>暂无内容</p>',
      toc: [],
      readingTime: 0,
      summary: EMPTY_SUMMARY,
    };
  }

  let dom: Document;
  try {
    const parser = new DOMParser();
    dom = parser.parseFromString(`<div id="md-root">${rawHtml}</div>`, 'text/html');
  } catch {
    return fallbackDocument(sanitize(rawHtml), content);
  }

  const root = dom.getElementById('md-root');
  if (!root) {
    return fallbackDocument(sanitize(rawHtml), content);
  }

  const toc = processDom(dom);
  const summary = buildSummary(root, toc);

  // Sanitize FIRST (removes any user-injected button/input/style)
  const sanitizedHtml = sanitize(root.innerHTML);

  // THEN inject code-block buttons into the sanitized HTML
  const finalHtml = injectCodeBlockButtons(sanitizedHtml);

  return {
    html: finalHtml,
    toc,
    readingTime: calcReadingTime(content),
    summary,
  };
}

export { detectLang as _detectLang };

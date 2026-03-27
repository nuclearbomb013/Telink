/**
 * Markdown 渲染组件
 * 支持语法高亮和优雅的排版
 * 包含 XSS 保护 (P2-29)
 */

import { useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize HTML to prevent XSS attacks (P2-29)
 * Removes script tags and dangerous attributes
 */
function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  // Remove data: URLs in href/src (except images)
  sanitized = sanitized.replace(/(href|src)\s*=\s*["']data:(?!image\/)[^"']*["']/gi, '');
  return sanitized;
}

/**
 * 渲染 Markdown 内容
 */
function renderMarkdown(content: any): string {
  // 确保 content 是字符串
  if (typeof content !== 'string') {
    console.error('renderMarkdown received non-string content:', typeof content, content);
    // 如果是对象但有有用的信息，尝试转换为字符串
    if (content === null || content === undefined) {
      return '<p class="text-brand-dark-gray/50">内容为空</p>';
    }
    // 如果是数组，将其连接成字符串
    if (Array.isArray(content)) {
      return `<p class="text-red-500">错误：期望字符串内容，但收到了数组</p>`;
    }
    // 对于其他类型，尝试使用 JSON.stringify
    try {
      const stringContent = JSON.stringify(content);
      return `<p class="text-red-500">内容格式错误，显示原始内容：</p><pre class="whitespace-pre-wrap font-mono text-sm">${escapeHtml(stringContent)}</pre>`;
    } catch {
      return '<p class="text-red-500">内容格式严重错误，无法渲染</p>';
    }
  }

  if (!content.trim()) {
    return '<p class="text-brand-dark-gray/50">暂无内容</p>';
  }

  try {
    // 配置 marked 用于语法高亮
    (marked as any).setOptions({
      breaks: true,
      gfm: true,
      highlight: function(code: string, lang?: string) {
        const language = lang || 'text';
        try {
          const validLanguage = hljs.getLanguage(language) ? language : 'text';
          return hljs.highlight(code, { language: validLanguage }).value;
        } catch {
          return hljs.highlightAuto(code).value;
        }
      }
    });

    // 使用marked解析Markdown
    const result = marked.parse(content);
    // P2-29: Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(result as string);
  } catch (error) {
    console.error('Markdown render error:', error);
    return `<p class="text-red-500">渲染失败：${error instanceof Error ? escapeHtml(error.message) : '未知错误'}</p><pre class="whitespace-pre-wrap font-mono text-sm">${escapeHtml(String(content))}</pre>`;
  }
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 渲染 Markdown 内容 - 使用 useMemo 避免在 effect 中调用 setState
  const renderedHtml = useMemo(() => {
    try {
      return renderMarkdown(content);
    } catch (err) {
      console.error('Render error:', err);
      return `<pre class="whitespace-pre-wrap font-mono text-sm">${escapeHtml(content)}</pre>`;
    }
  }, [content]);

  // 处理复制代码功能
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCopyClick = async (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('copy-code-btn')) return;

      const code = decodeURIComponent(target.dataset.code || '');

      try {
        await navigator.clipboard.writeText(code);
        target.textContent = '已复制!';
        target.classList.add('copied');

        setTimeout(() => {
          target.textContent = '复制';
          target.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    };

    container.addEventListener('click', handleCopyClick);
    return () => container.removeEventListener('click', handleCopyClick);
  }, [renderedHtml]);

  return (
    <div
      ref={containerRef}
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

export default MarkdownRenderer;
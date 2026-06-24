import { useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { compileMarkdown } from '@/lib/markdownCompiler';
import type { MarkdownDocument } from '@/services/reader.types';
import { useOptionalReaderPreferencesContext } from '@/hooks/ReaderPreferencesContext';

export interface MarkdownRendererProps {
  content?: string;
  document?: MarkdownDocument;
  mode?: 'preview' | 'reader';
  className?: string;
  onImageClick?: (src: string, alt: string, caption?: string) => void;
}

const EMPTY_DOCUMENT: MarkdownDocument = {
  html: '<p class="text-reader-secondary">暂无内容</p>',
  toc: [],
  readingTime: 0,
  summary: { lead: '', keyPoints: [], sectionTitles: [] },
};

export default function MarkdownRenderer({
  content,
  document: precompiled,
  mode = 'preview',
  className = '',
  onImageClick,
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReader = mode === 'reader';
  const readerPreferences = useOptionalReaderPreferencesContext();

  const renderedDocument = useMemo(() => {
    if (precompiled) return precompiled;
    if (content != null) return compileMarkdown(content);
    return EMPTY_DOCUMENT;
  }, [content, precompiled]);

  const handleCopy = useCallback(async (target: HTMLElement) => {
    const wrapper = target.closest('.code-block-wrapper');
    const codeEl = wrapper?.querySelector('code.hljs') as HTMLElement | null;
    const code = codeEl?.textContent || '';
    if (!code) return;

    const markCopied = () => {
      target.textContent = 'Copied';
      target.classList.add('copied');
      setTimeout(() => {
        target.textContent = 'Copy';
        target.classList.remove('copied');
      }, 2000);
    };

    try {
      await navigator.clipboard.writeText(code);
      markCopied();
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      markCopied();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isReader || !readerPreferences) return;

    const isWrapping = readerPreferences.preferences.codeWrap;
    for (const pre of container.querySelectorAll('pre')) {
      (pre as HTMLElement).style.whiteSpace = isWrapping ? 'pre-wrap' : 'pre';
    }
    for (const btn of container.querySelectorAll('.code-wrap-btn')) {
      btn.classList.toggle('code-wrap-btn--active', isWrapping);
      btn.setAttribute('aria-pressed', String(isWrapping));
      btn.textContent = isWrapping ? 'No wrap' : 'Wrap';
    }
  }, [isReader, readerPreferences, readerPreferences?.preferences.codeWrap, renderedDocument.html]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;

      if (target.classList.contains('copy-code-btn')) {
        event.preventDefault();
        handleCopy(target);
        return;
      }

      if (target.classList.contains('code-wrap-btn')) {
        event.preventDefault();

        if (isReader && readerPreferences) {
          readerPreferences.updatePreference('codeWrap', !readerPreferences.preferences.codeWrap);
          return;
        }

        const wrapper = target.closest('.code-block-wrapper');
        const pre = wrapper?.querySelector('pre') as HTMLElement | null;
        if (!pre) return;

        const isWrapping = pre.style.whiteSpace === 'pre-wrap';
        pre.style.whiteSpace = isWrapping ? 'pre' : 'pre-wrap';
        target.classList.toggle('code-wrap-btn--active', !isWrapping);
        target.setAttribute('aria-pressed', String(!isWrapping));
        target.textContent = isWrapping ? 'Wrap' : 'No wrap';
        return;
      }

      if (isReader && onImageClick) {
        const img = target.closest('img[data-viewer]') as HTMLImageElement | null;
        if (img) {
          const caption = img.dataset.caption || img.alt || '';
          onImageClick(img.src, img.alt, caption);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isReader || !onImageClick || (event.key !== 'Enter' && event.key !== ' ')) {
        return;
      }

      const img = (event.target as HTMLElement).closest('img[data-viewer]') as HTMLImageElement | null;
      if (!img) return;

      event.preventDefault();
      const caption = img.dataset.caption || img.alt || '';
      onImageClick(img.src, img.alt, caption);
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReader, onImageClick, handleCopy, readerPreferences]);

  return (
    <div
      ref={containerRef}
      className={cn('markdown-content', isReader && 'reader-markdown', className)}
      dangerouslySetInnerHTML={{ __html: renderedDocument.html }}
    />
  );
}

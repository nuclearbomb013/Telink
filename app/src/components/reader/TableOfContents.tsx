/**
 * TableOfContents — 文章目录
 *
 * 跟随滚动高亮当前章节，点击平滑滚动到对应标题。
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import type { TOCItem } from '@/services/reader.types';

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
}

export default function TableOfContents({ items, className }: TableOfContentsProps) {
  const activeId = useScrollSpy(items);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-toc-id="${activeId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  if (items.length === 0) return null;

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  };

  return (
    <nav className={cn('reader-toc', className)} aria-label="文章目录">
      <h2 className="reader-toc-title">目录</h2>
      <ul ref={listRef} className="reader-toc-list" role="list">
        {items.map(item => (
          <li key={item.id} className="reader-toc-item">
            <a
              href={`#${item.id}`}
              data-toc-id={item.id}
              data-toc-level={item.level}
              className={cn(
                'reader-toc-link',
                activeId === item.id && 'reader-toc-link--active',
              )}
              onClick={handleClick(item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

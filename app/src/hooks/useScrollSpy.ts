import { useState, useEffect, useRef, useCallback } from 'react';
import type { TOCItem } from '@/services/reader.types';

export function useScrollSpy(toc: TOCItem[]) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observeHeadings = useCallback(() => {
    observerRef.current?.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).map(e => e.target.id).filter(Boolean);
        if (visible.length > 0) setActiveId(visible[0]);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) obs.observe(el);
    });
    observerRef.current = obs;
  }, [toc]);

  useEffect(() => {
    observeHeadings();
    return () => observerRef.current?.disconnect();
  }, [observeHeadings]);

  return activeId;
}

interface ReadingProgressOptions {
  selector?: string;
}

export function useReadingProgress({ selector = '.reader-main' }: ReadingProgressOptions = {}): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrolled = -Math.min(0, rect.top);
      const total = rect.height - window.innerHeight;
      if (total <= 0) { setProgress(100); return; }
      setProgress(Math.round(Math.min(100, Math.max(0, (scrolled / total) * 100))));
    };
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };
    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    requestAnimationFrame(update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [selector]);

  return progress;
}

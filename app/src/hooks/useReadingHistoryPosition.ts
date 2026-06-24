import { useEffect } from 'react';
import { useHistory } from '@/hooks/useHistory';

interface UseReadingHistoryPositionOptions {
  contentType: string;
  contentId?: number | string | null;
  enabled?: boolean;
}

export function useReadingHistoryPosition({
  contentType,
  contentId,
  enabled = true,
}: UseReadingHistoryPositionOptions) {
  const { getHistoryEntry, updateScrollPosition } = useHistory();

  useEffect(() => {
    if (!enabled || contentId == null) return;

    const entry = getHistoryEntry(contentType, contentId);
    if (!entry?.scrollY || entry.scrollY < 80) return;

    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        window.scrollTo({ top: entry.scrollY, behavior: 'auto' });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [contentId, contentType, enabled, getHistoryEntry]);

  useEffect(() => {
    if (!enabled || contentId == null) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const savePosition = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        updateScrollPosition(contentType, contentId, Math.max(0, Math.round(window.scrollY)));
      }, 500);
    };

    window.addEventListener('scroll', savePosition, { passive: true });
    window.addEventListener('pagehide', savePosition);

    return () => {
      if (timer) clearTimeout(timer);
      updateScrollPosition(contentType, contentId, Math.max(0, Math.round(window.scrollY)));
      window.removeEventListener('scroll', savePosition);
      window.removeEventListener('pagehide', savePosition);
    };
  }, [contentId, contentType, enabled, updateScrollPosition]);
}

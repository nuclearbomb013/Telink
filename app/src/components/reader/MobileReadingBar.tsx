import { useState, useCallback } from 'react';
import { List, Settings, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReadingProgress } from '@/hooks/useScrollSpy';
import type { TOCItem } from '@/services/reader.types';
import TableOfContents from './TableOfContents';
import ReaderPreferencesPanel from './ReaderPreferences';

interface MobileReadingBarProps {
  toc: TOCItem[];
  selector?: string;
}

export default function MobileReadingBar({ toc, selector = '.reader-main' }: MobileReadingBarProps) {
  const [showToc, setShowToc] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const progress = useReadingProgress({ selector });

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="reader-mobile-bar">
      <div className="reader-mobile-bar-inner">
        <button
          className={cn('reader-mobile-bar-btn', showToc && 'reader-mobile-bar-btn--active')}
          onClick={() => { setShowToc(!showToc); setShowPrefs(false); }}
          aria-label="目录"
          aria-expanded={showToc}
        >
          <List size={20} />
        </button>

        <div className="reader-mobile-progress-mini" aria-hidden="true">
          <div className="reader-mobile-progress-mini-bar" style={{ width: `${progress}%` }} />
        </div>

        <button
          className={cn('reader-mobile-bar-btn', showPrefs && 'reader-mobile-bar-btn--active')}
          onClick={() => { setShowPrefs(!showPrefs); setShowToc(false); }}
          aria-label="阅读设置"
          aria-expanded={showPrefs}
        >
          <Settings size={20} />
        </button>

        <button className="reader-mobile-bar-btn" onClick={scrollToTop} aria-label="回到顶部">
          <ChevronUp size={20} />
        </button>
      </div>

      {showToc && toc.length > 0 && (
        <div className="reader-mobile-panel">
          <TableOfContents items={toc} />
        </div>
      )}

      {showPrefs && (
        <div className="reader-mobile-panel">
          <ReaderPreferencesPanel inline />
        </div>
      )}
    </div>
  );
}

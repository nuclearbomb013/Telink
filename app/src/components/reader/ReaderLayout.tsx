import { type ReactNode, useRef, useEffect } from 'react';
import { ReaderPreferencesProvider } from '@/hooks/useReaderPreferences';
import { useReaderPreferencesContext } from '@/hooks/ReaderPreferencesContext';

interface ReaderLayoutProps {
  sidebarLeft?: ReactNode;
  children: ReactNode;
  sidebarRight?: ReactNode;
  mobileBar?: ReactNode;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

function Shell({ sidebarLeft, children, sidebarRight, mobileBar, containerRef }: Omit<ReaderLayoutProps, 'containerRef'> & { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { preferences } = useReaderPreferencesContext();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const themeMap: Record<string, Record<string, string>> = {
      warm: { bg: '#F2F0E8', ink: '#242722', inkSecondary: '#62675F', green: '#315B48', line: '#CFCEC4' },
      gray: { bg: '#E8E6E0', ink: '#1A1C19', inkSecondary: '#5A5D55', green: '#3A5F4A', line: '#C0BEB4' },
      dark: { bg: '#1E1F1C', ink: '#D4D4CC', inkSecondary: '#9A9B93', green: '#5B9E7D', line: '#3A3B36' },
    };
    const fontMap: Record<string, string> = {
      sans: "'Roboto', sans-serif",
      serif: "'Noto Serif SC', Georgia, 'Times New Roman', serif",
    };
    const t = themeMap[preferences.theme] || themeMap.warm;
    el.style.setProperty('--reader-bg', t.bg);
    el.style.setProperty('--reader-ink', t.ink);
    el.style.setProperty('--reader-ink-secondary', t.inkSecondary);
    el.style.setProperty('--reader-green', t.green);
    el.style.setProperty('--reader-line', t.line);
    el.style.setProperty('--reader-font-family', fontMap[preferences.fontFamily] || fontMap.sans);
    el.style.setProperty('--reader-font-size', `${preferences.fontSize}px`);
    el.style.setProperty('--reader-line-height', String(preferences.lineHeight));
    el.style.setProperty('--reader-content-width', `${preferences.contentWidth}px`);
    el.style.setProperty('--reader-code-wrap', preferences.codeWrap ? 'pre-wrap' : 'pre');
    el.dataset.readerTheme = preferences.theme;
  }, [preferences, containerRef]);

  return (
    <div ref={containerRef} className="reader-shell" data-reader-theme={preferences.theme}>
      <div className="reader-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="reader-grid">
          <aside className="reader-sidebar-left" aria-label="文章信息">{sidebarLeft}</aside>
          <div className="reader-main" role="article">{children}</div>
          <aside className="reader-sidebar-right" aria-label="目录和设置">{sidebarRight}</aside>
        </div>
      </div>
      {mobileBar}
    </div>
  );
}

export default function ReaderLayout(props: Omit<ReaderLayoutProps, 'containerRef'>) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <ReaderPreferencesProvider>
      <Shell {...props} containerRef={containerRef} />
    </ReaderPreferencesProvider>
  );
}

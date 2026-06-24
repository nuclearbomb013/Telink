import { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReaderPreferencesContext } from '@/hooks/ReaderPreferencesContext';
import type { ReaderPreferences as ReaderPrefsType } from '@/services/reader.types';

interface ReaderPreferencesPanelProps {
  className?: string;
  inline?: boolean;
}

const THEME_OPTIONS: { value: ReaderPrefsType['theme']; label: string }[] = [
  { value: 'warm', label: '暖纸' },
  { value: 'gray', label: '灰纸' },
  { value: 'dark', label: '暗色' },
];

const FONT_FAMILY_OPTIONS: { value: ReaderPrefsType['fontFamily']; label: string }[] = [
  { value: 'sans', label: '无衬线' },
  { value: 'serif', label: '衬线' },
];

const FONT_SIZE_OPTIONS: ReaderPrefsType['fontSize'][] = [16, 18, 20, 22];
const LINE_HEIGHT_OPTIONS: ReaderPrefsType['lineHeight'][] = [1.6, 1.7, 1.85, 2.0];
const CONTENT_WIDTH_OPTIONS: ReaderPrefsType['contentWidth'][] = [640, 720, 820];

interface ReaderPreferencesContentProps {
  onClose?: () => void;
  showHeader?: boolean;
}

function ReaderPreferencesContent({ onClose, showHeader }: ReaderPreferencesContentProps) {
  const { preferences, updatePreference } = useReaderPreferencesContext();

  return (
    <>
      {showHeader && (
        <div className="reader-preferences-header">
          <h3 className="reader-preferences-title">阅读设置</h3>
          {onClose ? (
            <button
              className="reader-preferences-close"
              onClick={onClose}
              aria-label="关闭设置"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      )}

      <div className="reader-preferences-body">
        <div className="reader-pref-group">
          <label className="reader-pref-label">主题</label>
          <div className="reader-pref-options" role="radiogroup" aria-label="主题选择">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={cn('reader-pref-option', preferences.theme === opt.value && 'reader-pref-option--active')}
                onClick={() => updatePreference('theme', opt.value)}
                role="radio"
                aria-checked={preferences.theme === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reader-pref-group">
          <label className="reader-pref-label">字体</label>
          <div className="reader-pref-options" role="radiogroup" aria-label="字体选择">
            {FONT_FAMILY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={cn('reader-pref-option', preferences.fontFamily === opt.value && 'reader-pref-option--active')}
                onClick={() => updatePreference('fontFamily', opt.value)}
                role="radio"
                aria-checked={preferences.fontFamily === opt.value}
                style={opt.value === 'serif' ? { fontFamily: "'Noto Serif SC', Georgia, serif" } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reader-pref-group">
          <label className="reader-pref-label">字号</label>
          <div className="reader-pref-options" role="radiogroup" aria-label="字号选择">
            {FONT_SIZE_OPTIONS.map(size => (
              <button
                key={size}
                className={cn('reader-pref-option', preferences.fontSize === size && 'reader-pref-option--active')}
                onClick={() => updatePreference('fontSize', size)}
                role="radio"
                aria-checked={preferences.fontSize === size}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        <div className="reader-pref-group">
          <label className="reader-pref-label">行高</label>
          <div className="reader-pref-options" role="radiogroup" aria-label="行高选择">
            {LINE_HEIGHT_OPTIONS.map(lh => (
              <button
                key={lh}
                className={cn('reader-pref-option', preferences.lineHeight === lh && 'reader-pref-option--active')}
                onClick={() => updatePreference('lineHeight', lh)}
                role="radio"
                aria-checked={preferences.lineHeight === lh}
              >
                {lh}
              </button>
            ))}
          </div>
        </div>

        <div className="reader-pref-group">
          <label className="reader-pref-label">宽度</label>
          <div className="reader-pref-options" role="radiogroup" aria-label="宽度选择">
            {CONTENT_WIDTH_OPTIONS.map(w => (
              <button
                key={w}
                className={cn('reader-pref-option', preferences.contentWidth === w && 'reader-pref-option--active')}
                onClick={() => updatePreference('contentWidth', w)}
                role="radio"
                aria-checked={preferences.contentWidth === w}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        <div className="reader-pref-group">
          <label className="reader-pref-label">代码换行</label>
          <button
            className={cn('reader-pref-toggle', preferences.codeWrap && 'reader-pref-toggle--active')}
            onClick={() => updatePreference('codeWrap', !preferences.codeWrap)}
            role="switch"
            aria-checked={preferences.codeWrap}
          >
            {preferences.codeWrap ? '开' : '关'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function ReaderPreferencesPanel({ className, inline = false }: ReaderPreferencesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || inline) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [inline, isOpen]);

  if (inline) {
    return (
      <div className={cn('reader-preferences-panel reader-preferences-panel--inline', className)}>
        <ReaderPreferencesContent />
      </div>
    );
  }

  return (
    <div ref={panelRef} className={cn('reader-preferences', className)}>
      <button
        className="reader-preferences-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="阅读设置"
        aria-expanded={isOpen}
      >
        <Settings size={18} />
      </button>

      {isOpen && (
        <div className="reader-preferences-panel" role="dialog" aria-label="阅读设置">
          <ReaderPreferencesContent showHeader onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}

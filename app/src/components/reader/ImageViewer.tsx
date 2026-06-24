/**
 * ImageViewer — 图片查看器
 *
 * 全屏遮罩，点击图片触发。支持 ESC 关闭、遮罩点击关闭、焦点管理。
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt, caption, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    containerRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));

  return (
    <div
      ref={containerRef}
      className="image-viewer-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-label={alt || '图片查看'}
      tabIndex={-1}
    >
      <div className="image-viewer-toolbar">
        <button className="image-viewer-btn" onClick={zoomIn} aria-label="放大">
          <ZoomIn size={20} />
        </button>
        <button className="image-viewer-btn" onClick={zoomOut} aria-label="缩小">
          <ZoomOut size={20} />
        </button>
        <button className="image-viewer-btn" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
      </div>

      <div className="image-viewer-content">
        <img
          src={src}
          alt={alt}
          className="image-viewer-img"
          style={{ transform: `scale(${scale})` }}
        />
        {caption && <p className="image-viewer-caption">{caption}</p>}
      </div>
    </div>
  );
}

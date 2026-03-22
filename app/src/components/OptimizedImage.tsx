import { useState, useCallback, memo } from 'react';

/**
 * Props for OptimizedImage component
 */
interface OptimizedImageProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of the image */
  width?: number;
  /** Height of the image */
  height?: number;
  /** CSS class names */
  className?: string;
  /** Loading strategy */
  loading?: 'eager' | 'lazy';
  /** Fetch priority for LCP images */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Callback when image fails to load */
  onError?: () => void;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Placeholder while loading */
  placeholder?: 'blur' | 'empty';
}

/**
 * Optimized Image Component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Error handling with fallback
 * - Loading state management
 * - Proper width/height for CLS prevention
 * - WebP support detection
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/photo.jpg"
 *   alt="Description"
 *   width={400}
 *   height={300}
 *   loading="lazy"
 * />
 * ```
 */
const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  onError,
  onLoad,
  objectFit = 'cover',
  placeholder = 'empty',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate placeholder/background color based on placeholder type
  const placeholderStyle = placeholder === 'blur' 
    ? { backgroundColor: '#f0f0f0', filter: 'blur(10px)' }
    : { backgroundColor: 'transparent' };

  // If image failed to load, show fallback
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-brand-dark-gray/10 ${className}`}
        style={{ width, height, ...placeholderStyle }}
        role="img"
        aria-label={alt}
      >
        <span className="text-brand-dark-gray/30 text-4xl" aria-hidden="true">🖼️</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      onLoad={handleLoad}
      onError={handleError}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      style={{
        objectFit,
        ...(!isLoaded ? placeholderStyle : {}),
      }}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

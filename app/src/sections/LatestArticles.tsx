import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { latestArticlesConfig } from '@/config';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { EASING, DURATION, STAGGER } from '@/constants/animation.constants';

/**
 * Latest Articles Component
 *
 * Horizontal scrolling article showcase with arrow button controls.
 * Similar to Apple's product showcase with smooth card-based navigation.
 */
const LatestArticles = () => {
  // All hooks must be called before any conditional logic
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const leftButtonRef = useRef<HTMLButtonElement>(null);
  const rightButtonRef = useRef<HTMLButtonElement>(null);

  // Config values
  const articles = latestArticlesConfig.articles;
  const totalCards = articles.length;

  const prefersReducedMotion = useReduceMotion();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardWidth, setCardWidth] = useState(400);
  const [gap, setGap] = useState(48);
  const [, setCardsPerView] = useState(3);
  const [maxIndex, setMaxIndex] = useState(() => Math.max(0, totalCards - 3));
  const [buttonsVisible] = useState(true);

  // Check if we should render
  const shouldRender = Boolean(latestArticlesConfig.sectionTitle || articles.length > 0);

  /**
   * Update dimensions on mount and resize
   */
  useEffect(() => {
    if (!shouldRender) return;

    const updateDimensions = () => {
      const width = window.innerWidth >= 1024 ? 400 : window.innerWidth >= 768 ? 320 : 280;
      const spacing = window.innerWidth >= 1024 ? 48 : 24;
      const viewCount = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
      const maxIdx = Math.max(0, totalCards - viewCount);

      setCardWidth(width);
      setGap(spacing);
      setCardsPerView(viewCount);
      setMaxIndex(maxIdx);

      // Reset current index if it's out of bounds
      setCurrentIndex((prev) => Math.min(prev, maxIdx));
    };

    // Initialize immediately
    updateDimensions();

    // Listen for window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [totalCards, shouldRender]);

  /**
   * Navigate to a specific card index
   */
  const navigateToIndex = useCallback((targetIndex: number) => {
    // Clamp index within bounds
    const clampedIndex = Math.max(0, Math.min(targetIndex, maxIndex));
    if (clampedIndex === currentIndex || isAnimating) return;

    setIsAnimating(true);

    const targetX = -(clampedIndex * (cardWidth + gap));

    if (prefersReducedMotion) {
      // For reduced motion, just jump to position
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${targetX}px)`;
      }
      setIsAnimating(false);
      setCurrentIndex(clampedIndex);
      return;
    }

    // Animate track with smooth easing (with null check)
    if (trackRef.current) {
      gsap.to(trackRef.current, {
        x: targetX,
        duration: DURATION.slow,
        ease: EASING.expoOut,
        onComplete: () => {
          setIsAnimating(false);
          setCurrentIndex(clampedIndex);
        },
      });
    } else {
      // Fallback if ref is not available
      setIsAnimating(false);
      setCurrentIndex(clampedIndex);
    }

    // Subtle card scale animation during transition
    if (cardsWrapperRef.current) {
      const cards = cardsWrapperRef.current.children;
      const tl = gsap.timeline(); // 使用 timeline 来组织动画
      tl.fromTo(
        cards,
        { scale: 0.97 },
        {
          scale: 1,
          duration: DURATION.normal,
          ease: EASING.smooth,
          stagger: STAGGER.fast,
        }
      );
    }
  }, [currentIndex, isAnimating, maxIndex, prefersReducedMotion, cardWidth, gap]);

  /**
   * Navigate to previous card(s)
   */
  const navigateLeft = useCallback(() => {
    navigateToIndex(currentIndex - 1);
  }, [currentIndex, navigateToIndex]);

  /**
   * Navigate to next card(s)
   */
  const navigateRight = useCallback(() => {
    navigateToIndex(currentIndex + 1);
  }, [currentIndex, navigateToIndex]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateLeft();
      } else if (e.key === 'ArrowRight') {
        navigateRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateLeft, navigateRight, shouldRender]);

  /**
   * Initialize scroll-triggered animations
   */
  useEffect(() => {
    if (prefersReducedMotion || !sectionRef.current || !shouldRender) {
      return;
    }

    const ctx = gsap.context(() => {
      // Animate section entry
      gsap.from('.articles-title', {
        y: 50,
        opacity: 0,
        duration: DURATION.slow,
        ease: EASING.expoOut,
      });

      gsap.from('.article-card', {
        y: 80,
        duration: DURATION.medium,
        ease: EASING.expoOut,
        stagger: STAGGER.normal,
        delay: DURATION.fast,
        clearProps: 'y, opacity',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion, shouldRender]);

  const handleCardHover = (index: number | null) => {
    setHoveredIndex(index);
  };

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < maxIndex;
  const progress = maxIndex > 0 ? currentIndex / maxIndex : 0;

  // Move conditional render to return statement
  if (!shouldRender) {
    return null;
  }

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-32">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Section title */}
        <div className="mb-12 lg:mb-16">
          <h2 className="articles-title font-oswald font-light text-4xl lg:text-5xl xl:text-6xl text-brand-text">
            {latestArticlesConfig.sectionTitle}
          </h2>
        </div>

        {/* Cards container with side navigation arrows */}
        <div className="relative">
          {/* Left Navigation Button - Large Triangle with Highlight */}
          <button
            ref={leftButtonRef}
            onClick={navigateLeft}
            disabled={!canGoLeft || isAnimating}
            className={`nav-arrow-button absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
              !buttonsVisible ? 'opacity-0 pointer-events-none' : ''
            } ${
              canGoLeft
                ? 'opacity-100 hover:scale-110 active:scale-95'
                : 'opacity-30 cursor-not-allowed'
            } ${isAnimating ? 'pointer-events-none' : ''}`}
            style={{
              width: '0',
              height: '0',
              borderTop: '40px solid transparent',
              borderBottom: '40px solid transparent',
              borderRight: canGoLeft ? '50px solid #000000' : '50px solid #666666',
              marginLeft: '-20px',
              filter: canGoLeft ? 'drop-shadow(-4px 0 8px rgba(0,0,0,0.3))' : 'none',
            }}
            aria-label="上一篇文章"
          >
            <span
              className="absolute text-white font-bold pointer-events-none"
              style={{
                fontSize: '20px',
                right: '-35px',
                top: '-12px',
              }}
            >
              &#8249;
            </span>
          </button>

          {/* Cards container with overflow hidden */}
          <div ref={containerRef} className="relative mx-16 lg:mx-20 overflow-hidden">
            {/* Track that moves left/right - removing hardcoded transform */}
            <div
              ref={trackRef}
              className="flex will-change-transform"
            >
              <div ref={cardsWrapperRef} className="flex gap-6 lg:gap-12 px-1">
                {articles.map((article, index) => (
                  <Link
                    key={article.id}
                    to={`/articles/${article.slug || article.id}`}
                    className={`article-card relative flex-shrink-0 transition-all duration-500 block ${
                      hoveredIndex === index ? 'scale-105 z-10' : 'scale-100 z-0'
                    }`}
                    style={{ width: cardWidth }}
                    onMouseEnter={() => handleCardHover(index)}
                    onMouseLeave={() => handleCardHover(null)}
                    aria-label={`阅读文章：${article.title}`}
                  >
                    {/* Image container with proper background */}
                    <div
                      className={`relative overflow-hidden transition-all duration-500 bg-brand-text ${
                        hoveredIndex === index ? 'scale-105' : 'scale-100'
                      }`}
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-brand-text">
                        {article.image && article.image.trim() !== '' ? (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                            loading="lazy"
                            width={cardWidth}
                            height={Math.round(cardWidth * 4 / 3)}
                            onError={(e) => {
                              // Fallback to solid color if image fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-dark-gray/10">
                            <span className="text-brand-dark-gray/30 text-4xl" aria-hidden="true">📄</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title - with higher z-index to prevent occlusion */}
                    <div
                      className={`relative z-10 mt-4 transition-all duration-500 bg-brand-linen/0 ${
                        hoveredIndex === index ? '-translate-y-2' : 'translate-y-0'
                      }`}
                    >
                      <span className="font-roboto text-xs uppercase tracking-wider text-brand-dark-gray block">
                        {article.category}
                      </span>
                      <h3 className="font-oswald font-light text-xl lg:text-2xl text-brand-text mt-1 leading-tight">
                        {article.title}
                      </h3>
                      <p className="font-roboto text-sm text-brand-dark-gray mt-1">{article.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Navigation Button - Large Triangle with Highlight */}
          <button
            ref={rightButtonRef}
            onClick={navigateRight}
            disabled={!canGoRight || isAnimating}
            className={`nav-arrow-button absolute right-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
              !buttonsVisible ? 'opacity-0 pointer-events-none' : ''
            } ${
              canGoRight
                ? 'opacity-100 hover:scale-110 active:scale-95'
                : 'opacity-30 cursor-not-allowed'
            } ${isAnimating ? 'pointer-events-none' : ''}`}
            style={{
              width: '0',
              height: '0',
              borderTop: '40px solid transparent',
              borderBottom: '40px solid transparent',
              borderLeft: canGoRight ? '50px solid #000000' : '50px solid #666666',
              marginRight: '-20px',
              filter: canGoRight ? 'drop-shadow(4px 0 8px rgba(0,0,0,0.3))' : 'none',
            }}
            aria-label="下一篇文章"
          >
            <span
              className="absolute text-white font-bold pointer-events-none"
              style={{
                fontSize: '20px',
                left: '-35px',
                top: '-12px',
              }}
            >
              &#8250;
            </span>
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-12 flex items-center justify-center gap-8">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => navigateToIndex(i)}
                disabled={isAnimating}
                className={`transition-all duration-300 rounded-full ${
                  i === currentIndex
                    ? 'w-8 h-2 bg-brand-text'
                    : 'w-2 h-2 bg-brand-text/30 hover:bg-brand-text/50'
                }`}
                aria-label={`跳转到第 ${i + 1} 页`}
                aria-current={i === currentIndex ? 'true' : undefined}
              />
            ))}
          </div>

          {/* Desktop counter */}
          <div className="hidden sm:flex items-center gap-3 text-sm text-brand-dark-gray">
            <span className="font-oswald text-lg">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="text-brand-text/30">/</span>
            <span className="font-oswald text-lg">{String(maxIndex + 1).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="h-px bg-brand-border overflow-hidden">
            <div
              className="h-full bg-brand-text transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
              role="progressbar"
              aria-valuenow={currentIndex}
              aria-valuemin={0}
              aria-valuemax={maxIndex}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestArticles;

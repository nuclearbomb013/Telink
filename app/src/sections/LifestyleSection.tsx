import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';

import { lifestyleConfig } from '@/config';

/**
 * Lifestyle Section Component
 *
 * Scattered polaroid-style cards with hover effects and 3D transforms.
 */
const LifestyleSection = () => {
  // All hooks must be called before any conditional logic
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  // Check if we should render
  const shouldRender = Boolean(lifestyleConfig.sectionTitle || lifestyleConfig.articles.length > 0);

  useEffect(() => {
    if (!shouldRender) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
          },
        }
      );

      // Cards fly in animation
      const cards = cardsContainerRef.current?.querySelectorAll('.lifestyle-card');
      if (cards) {
        cards.forEach((card, index) => {
          const randomRotation = (Math.random() - 0.5) * 30;
          const randomX = (Math.random() - 0.5) * 200;

          gsap.fromTo(
            card,
            {
              z: -500,
              rotateZ: randomRotation,
              opacity: 0,
              x: randomX,
            },
            {
              z: 0,
              rotateZ: lifestyleConfig.articles[index]?.rotation || 0,
              opacity: 1,
              x: 0,
              duration: 1.2,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: cardsContainerRef.current,
                start: 'top 80%',
              },
              delay: index * 0.15,
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldRender]);

  const handleCardClick = (id: number) => {
    setActiveCard(activeCard === id ? null : id);
  };

  const handleCardHover = useCallback((card: HTMLElement, isEntering: boolean, article: typeof lifestyleConfig.articles[0]) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (isEntering) {
      gsap.to(card, {
        rotateZ: 0,
        scale: 1.05,
        zIndex: 100,
        duration: 0.4,
        ease: 'power2.out',
      });
    } else {
      gsap.to(card, {
        rotateZ: article.rotation,
        scale: 1,
        zIndex: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }, []);

  // Move conditional render to return statement
  if (!shouldRender) {
    return null;
  }

  return (
    <section ref={sectionRef} id="lifestyle" className="relative py-20 lg:py-32 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div ref={titleRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 lg:mb-20">
          <h2 className="font-oswald font-light text-4xl lg:text-5xl xl:text-6xl text-brand-text">
            {lifestyleConfig.sectionTitle}
          </h2>
          <a
            href="#"
            className="group inline-flex items-center gap-2 font-roboto text-sm uppercase tracking-wider text-brand-text hover:text-brand-dark-gray transition-colors cursor-hover"
          >
            {lifestyleConfig.viewMoreText}
            <ArrowRight size={14} className="transform transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>

        {/* Scattered Cards */}
        <div
          ref={cardsContainerRef}
          className="relative min-h-[800px] lg:min-h-[900px] perspective-2000"
        >
          {lifestyleConfig.articles.map((article, index) => {
            // Calculate grid position with scatter effect
            const col = index % 3;
            const row = Math.floor(index / 3);
            const baseX = col * 33;
            const baseY = row * 50;

            return (
              <div
                key={article.id}
                className="lifestyle-card absolute cursor-hover preserve-3d"
                style={{
                  left: `${baseX + (article.position.x / 10)}%`,
                  top: `${baseY + (article.position.y / 5)}%`,
                  transform: `rotateZ(${article.rotation}deg)`,
                  zIndex: activeCard === article.id ? 100 : hoveredCard === article.id ? 50 : (article.baseZIndex || 1),
                }}
                onMouseEnter={(e) => {
                  setHoveredCard(article.id);
                  handleCardHover(e.currentTarget, true, article);
                }}
                onMouseLeave={(e) => {
                  setHoveredCard(null);
                  handleCardHover(e.currentTarget, false, article);
                }}
                onClick={() => handleCardClick(article.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(article.id);
                  }
                }}
                aria-label={`${article.title} - ${article.excerpt}`}
              >
                <div className="w-[240px] sm:w-[280px] lg:w-[300px] bg-white p-3 shadow-xl">
                  {/* Image */}
                  <div className="aspect-[2/3] overflow-hidden mb-3">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-expo-out hover:scale-105"
                      loading="lazy"
                      width="300"
                      height="450"
                    />
                  </div>

                  {/* Content */}
                  <div className="px-1">
                    <h3 className="font-oswald font-light text-lg text-brand-text">
                      {article.title}
                    </h3>
                    <p className="font-roboto text-xs text-brand-dark-gray mt-1">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Gloss effect overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"
                  style={{
                    transform: 'translateZ(1px)',
                  }}
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LifestyleSection;

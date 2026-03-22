import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { designConfig } from '@/config';

/**
 * Design Section Component
 *
 * Mosaic grid layout with hover effects and grayscale to color transitions.
 */
const DesignSection = () => {
  // All hooks must be called before any conditional logic
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  // Check if we should render
  const shouldRender = Boolean(designConfig.sectionTitle || designConfig.items.length > 0);

  useEffect(() => {
    if (!shouldRender) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Title animation with mask effect
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
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

      // Cascade reveal for grid items
      const gridItems = gridRef.current?.querySelectorAll('.design-tile');
      if (gridItems) {
        gridItems.forEach((item, index) => {
          gsap.fromTo(
            item,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: item,
                start: 'top 90%',
              },
              delay: (index % 3) * 0.1,
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldRender]);

  const handleTileHover = (id: number | null) => {
    setHoveredItem(id);
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'tall':
        return 'row-span-2';
      case 'wide':
        return 'col-span-2';
      default:
        return '';
    }
  };

  // Move conditional render to return statement
  if (!shouldRender) {
    return null;
  }

  return (
    <section ref={sectionRef} id="design" className="relative py-20 lg:py-32 bg-white">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Title with mask effect */}
        <div ref={titleRef} className="mb-12 lg:mb-16">
          <h2 className="font-oswald font-extralight text-5xl lg:text-6xl xl:text-8xl text-brand-text relative inline-block">
            {designConfig.sectionTitle}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-linen/50 to-transparent mix-blend-overlay pointer-events-none" aria-hidden="true" />
          </h2>
        </div>

        {/* Mosaic Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 lg:grid-cols-3 gap-1 lg:gap-2"
          role="list"
          aria-label="设计作品展示"
        >
          {designConfig.items.map((item) => (
            <div
              key={item.id}
              className={`design-tile group relative overflow-hidden cursor-hover ${getSizeClasses(item.size)}`}
              style={item.gridColumn ? { gridColumn: item.gridColumn } : undefined}
              onMouseEnter={() => handleTileHover(item.id)}
              onMouseLeave={() => handleTileHover(null)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTileHover(hoveredItem === item.id ? null : item.id);
                }
              }}
              aria-label={item.title}
            >
              {/* Image - Grayscale to Color */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className={`w-full h-full object-cover transition-all duration-700 ease-expo-out ${
                    hoveredItem === item.id
                      ? 'grayscale-0 scale-110'
                      : 'grayscale scale-100'
                  }`}
                  loading="lazy"
                  width="400"
                  height="400"
                />

                {/* Magnifier effect overlay */}
                <div
                  className={`absolute inset-0 bg-brand-pure-black/60 flex flex-col justify-end p-4 lg:p-6 transition-opacity duration-500 ${
                    hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <h3 className="font-oswald font-light text-xl lg:text-2xl text-white">
                    {item.title}
                  </h3>
                  {item.quote && (
                    <p className="font-roboto text-xs lg:text-sm text-white/70 mt-2 italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-12 text-center">
          <a
            href="#"
            className="inline-block font-roboto text-sm uppercase tracking-widest text-brand-dark-gray hover:text-brand-text transition-colors cursor-hover relative group"
          >
            {designConfig.viewMoreText}
            <span className="absolute bottom-0 left-0 w-full h-px bg-brand-text transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default DesignSection;

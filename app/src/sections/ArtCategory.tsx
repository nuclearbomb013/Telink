import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Calendar } from 'lucide-react';
import { artCategoryConfig } from '@/config';

/**
 * Art Category Section Component
 *
 * Features a fixed sidebar with categories and events,
 * plus a main content area with featured article and grid layout.
 */
const ArtCategory = () => {
  // All hooks must be called before any conditional logic
  const sectionRef = useRef<HTMLElement>(null);
  const featuredImageRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState(artCategoryConfig.categories[0] || '');

  // Check if we should render
  const shouldRender = Boolean(artCategoryConfig.sectionTitle || artCategoryConfig.gridArticles.length > 0);

  useEffect(() => {
    if (!shouldRender) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Featured image clip-path reveal
      gsap.fromTo(
        featuredImageRef.current,
        { clipPath: 'circle(0% at 50% 50%)' },
        {
          clipPath: 'circle(150% at 50% 50%)',
          duration: 1.4,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: featuredImageRef.current,
            start: 'top 80%',
          },
        }
      );

      // Sidebar elements stagger
      const sidebarElements = sidebarRef.current?.querySelectorAll('.sidebar-item');
      if (sidebarElements) {
        gsap.fromTo(
          sidebarElements,
          { x: -50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: sidebarRef.current,
              start: 'top 80%',
            },
          }
        );
      }

      // Grid articles stagger from bottom
      const gridItems = gridRef.current?.querySelectorAll('.grid-article');
      if (gridItems) {
        gsap.fromTo(
          gridItems,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 85%',
            },
          }
        );
      }

      // Pin sidebar on scroll
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: sidebarRef.current,
        pinSpacing: false,
      });

      // Featured image scale on scroll
      gsap.to(featuredImageRef.current, {
        scale: 0.9,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldRender]);

  // Move conditional render to return statement
  if (!shouldRender) {
    return null;
  }

  return (
    <section ref={sectionRef} id="art" className="relative py-20 lg:py-32">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Section title */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 lg:mb-20">
          <h2 className="font-oswald font-light text-4xl lg:text-5xl xl:text-6xl text-brand-text">
            {artCategoryConfig.sectionTitle}
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Sidebar - 3 columns */}
          <div ref={sidebarRef} className="lg:col-span-3 lg:sticky lg:top-28 xl:top-32 h-fit">
            {/* Categories */}
            <div className="sidebar-item mb-8">
              <h3 className="font-oswald text-xs uppercase tracking-widest text-brand-dark-gray mb-4">
                {artCategoryConfig.categoriesLabel}
              </h3>
              <div className="flex flex-col gap-2" role="tablist" aria-label="文章分类">
                {artCategoryConfig.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-left font-roboto text-sm py-2 px-3 transition-all duration-300 cursor-hover ${
                      activeCategory === cat
                        ? 'bg-brand-text text-brand-linen'
                        : 'text-brand-dark-gray hover:text-brand-text hover:bg-brand-border/50'
                    }`}
                    role="tab"
                    aria-selected={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="sidebar-item">
              <h3 className="font-oswald text-xs uppercase tracking-widest text-brand-dark-gray mb-4 flex items-center gap-2">
                <Calendar size={14} aria-hidden="true" />
                {artCategoryConfig.eventsLabel}
              </h3>
              <div className="flex flex-col gap-4">
                {artCategoryConfig.events.map((event, index) => (
                  <div key={index} className="group cursor-hover">
                    <p className="font-roboto text-xs text-brand-light-gray">
                      {event.date} · {event.location}
                    </p>
                    <p className="font-roboto text-sm text-brand-text group-hover:text-brand-dark-gray transition-colors">
                      {event.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content - 9 columns */}
          <div className="lg:col-span-9">
            {/* Featured Article */}
            <div className="mb-12 lg:mb-20">
              <div
                ref={featuredImageRef}
                className="relative aspect-[16/10] overflow-hidden mb-6"
              >
                <img
                  src={artCategoryConfig.featuredImage}
                  alt={artCategoryConfig.featuredImageAlt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width="900"
                  height="563"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-pure-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="font-roboto text-xs uppercase tracking-wider text-white/80 mb-2 block">
                    {artCategoryConfig.featuredLabel}
                  </span>
                  <h2 className="font-oswald font-light text-3xl lg:text-4xl xl:text-5xl text-white leading-tight">
                    {artCategoryConfig.featuredTitle}
                  </h2>
                </div>
              </div>

              <p className="font-roboto text-base text-brand-dark-gray max-w-2xl mb-6">
                {artCategoryConfig.featuredDescription}
              </p>

              <a
                href="#"
                className="group inline-flex items-center gap-2 font-roboto text-sm uppercase tracking-wider text-brand-text hover:text-brand-dark-gray transition-colors cursor-hover"
              >
                {artCategoryConfig.featuredCtaText}
                <ArrowRight size={14} className="transform transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </a>
            </div>

            {/* Grid Articles */}
            <div ref={gridRef} className="grid sm:grid-cols-2 gap-6 lg:gap-8">
              {artCategoryConfig.gridArticles.map((article) => (
                <article
                  key={article.id}
                  className="grid-article group cursor-hover border-t border-brand-border pt-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-roboto text-xs uppercase tracking-wider text-brand-light-gray">
                        {article.category}
                      </span>
                      <h4 className="font-oswald font-light text-xl text-brand-text mt-1 group-hover:text-brand-dark-gray transition-colors">
                        {article.title}
                      </h4>
                      <p className="font-roboto text-xs text-brand-dark-gray mt-2">
                        {article.readTime}{artCategoryConfig.readSuffix}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-brand-light-gray group-hover:text-brand-text transition-colors flex-shrink-0 mt-1" aria-hidden="true" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArtCategory;

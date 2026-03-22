# Exhibition Style Template

A high-end editorial/magazine-style single-page website template built with React, TypeScript, Tailwind CSS, and GSAP. Features smooth scroll, custom cursor, noise overlay, magnetic effects, and rich scroll-triggered animations.

## Features

- **Split Screen Hero** with 3D perspective tilt and parallax scroll
- **Horizontal Scroll Gallery** with velocity-based card skew
- **Art Category** section with fixed sidebar and clip-path image reveal
- **Scattered Polaroid Cards** with fly-in and hover lift animations
- **Mosaic Grid** with grayscale-to-color hover and neighbor push effect
- **Parallax Video Background** with scroll-driven playback rate
- **Orbital Avatar System** with drag/swipe interaction
- **Instagram Gallery** with streak hover effect
- **Curtain Reveal Footer** with dark-mode email focus effect
- **Custom Cursor** (dot + ring) with hover state detection
- **Noise Texture Overlay** for film grain effect
- **Magnetic Elements** that attract toward the cursor
- **Lenis Smooth Scroll** for buttery page scrolling
- **Scroll Animations** via GSAP ScrollTrigger

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 3
- GSAP + ScrollTrigger
- Lenis (smooth scroll)
- Lucide React (icons)
- Radix UI primitives

## Project Structure

```
exhibition-style/
├── index.html              # HTML entry point
├── package.json
├── tailwind.config.js      # Tailwind with custom brand colors/fonts
├── vite.config.ts
├── public/
│   └── images/.gitkeep     # Place your images here
└── src/
    ├── App.tsx              # Root component (sets title/lang from config)
    ├── App.css              # Legacy Vite defaults (unused)
    ├── index.css            # Global styles, noise overlay, cursor, animations
    ├── main.tsx             # React entry point
    ├── config.ts            # ALL content configuration
    ├── components/
    │   ├── CustomCursor.tsx  # Custom dot+ring cursor
    │   ├── NoiseOverlay.tsx  # Film grain overlay
    │   └── ui/              # shadcn/ui components
    ├── hooks/
    │   ├── useCustomCursor.ts
    │   ├── useLenis.ts
    │   ├── useMagneticEffect.ts
    │   ├── useScrollAnimation.ts
    │   └── use-mobile.ts
    ├── lib/
    │   └── utils.ts
    └── sections/
        ├── Navigation.tsx
        ├── HeroSection.tsx
        ├── LatestArticles.tsx
        ├── ArtCategory.tsx
        ├── LifestyleSection.tsx
        ├── DesignSection.tsx
        ├── GreenTribe.tsx
        ├── AuthorsSection.tsx
        ├── InstagramGallery.tsx
        └── Footer.tsx
```

## Quick Start

```bash
npm install
npm run dev
```

## Configuration

All content is managed through `src/config.ts`. Edit the exported config objects to populate the site.

### siteConfig

| Field | Type | Description |
|-------|------|-------------|
| title | string | Document title |
| description | string | Meta description |
| language | string | HTML lang attribute (e.g. "en", "zh-CN") |

### navigationConfig

| Field | Type | Description |
|-------|------|-------------|
| brandName | string | Logo/brand text |
| links | NavLink[] | Nav items with label + href |
| searchPlaceholder | string | Search input placeholder |
| searchHint | string | Hint text below search input |
| searchAriaLabel | string | Aria label for search button |
| closeSearchAriaLabel | string | Aria label for close search button |

### heroConfig

| Field | Type | Description |
|-------|------|-------------|
| date | string | Vertical date display |
| titleLine1 | string | First line of hero title (light weight) |
| titleLine2 | string | Second line (medium weight, bold) |
| readTime | string | Reading time text |
| description | string | Hero paragraph |
| ctaText | string | Call-to-action button text |
| image | string | Hero image path |
| imageAlt | string | Image alt text |

### latestArticlesConfig

| Field | Type | Description |
|-------|------|-------------|
| sectionTitle | string | Section heading |
| articles | ArticleItem[] | Array of {id, title, subtitle, image, category} |

### artCategoryConfig

| Field | Type | Description |
|-------|------|-------------|
| sectionTitle | string | Section heading |
| categoriesLabel | string | Sidebar categories heading |
| eventsLabel | string | Sidebar events heading |
| categories | string[] | Category filter buttons |
| events | EventItem[] | Array of {date, title, location} |
| featuredImage | string | Featured article image |
| featuredImageAlt | string | Featured image alt |
| featuredLabel | string | Label badge (e.g. "Featured") |
| featuredTitle | string | Featured article title |
| featuredDescription | string | Featured article text |
| featuredCtaText | string | CTA link text |
| gridArticles | GridArticle[] | Array of {id, title, category, readTime} |
| readSuffix | string | Text after read time (e.g. " read") |

### lifestyleConfig

| Field | Type | Description |
|-------|------|-------------|
| sectionTitle | string | Section heading |
| viewMoreText | string | View more link text |
| articles | LifestyleArticle[] | Array of {id, title, excerpt, image, rotation, position, baseZIndex?} |

### designConfig

| Field | Type | Description |
|-------|------|-------------|
| sectionTitle | string | Section heading |
| viewMoreText | string | View more link text |
| items | DesignItem[] | Array of {id, title, quote, image, size, gridColumn?} |

### greenTribeConfig

| Field | Type | Description |
|-------|------|-------------|
| sectionTitle | string | Section heading |
| sectionDescription | string | Description below title |
| readMoreText | string | Card CTA text |
| joinTitle | string | Sidebar join heading |
| joinDescription | string | Sidebar description |
| emailPlaceholder | string | Email input placeholder |
| subscribeText | string | Subscribe button text |
| memberCountText | string | Member count display |
| videoSrc | string | Background video URL |
| videoPoster | string | Video poster image |
| members | TribeMember[] | Array of {id, name, role, title, excerpt, avatar} |

### authorsConfig

| Field | Type | Description |
|-------|------|-------------|
| sectionTitle | string | Section heading |
| sectionSubtitle | string | Subtitle text |
| articlesSuffix | string | Text after article count |
| authors | Author[] | Array of {id, name, role, avatar, articles, social} |

### instagramGalleryConfig

| Field | Type | Description |
|-------|------|-------------|
| handle | string | Instagram handle (e.g. "@myhandle") |
| handleUrl | string | Instagram profile URL |
| description | string | Description text |
| followText | string | Follow button text |
| likesSuffix | string | Text after likes count |
| images | InstagramImage[] | Array of {id, image, likes} |

### footerConfig

| Field | Type | Description |
|-------|------|-------------|
| brandWatermark | string | Large background watermark text |
| newsletterTitle | string | Newsletter heading |
| newsletterDescription | string | Newsletter description |
| emailPlaceholder | string | Email input placeholder |
| subscribeText | string | Subscribe button text |
| subscribeSuccessMessage | string | Alert on form submit |
| categoriesLabel | string | Categories column heading |
| categories | string[] | Category link items |
| pagesLabel | string | Pages column heading |
| pages | string[] | Page link items |
| legalLabel | string | Legal column heading |
| legalLinks | string[] | Legal link items |
| socialLabel | string | Social column heading |
| socialLinks | object | {instagram, twitter, youtube} URLs |
| backToTopText | string | Back to top button text |
| copyright | string | Copyright text |
| credit | string | Credit line |

## Required Images

Place all images in the `public/` directory. The following image paths are referenced in config:

| Config | Image Fields | Recommended Specs |
|--------|-------------|-------------------|
| heroConfig | image | 1:1 aspect ratio, ~800x800px |
| latestArticlesConfig | articles[].image | 3:4 aspect ratio, ~600x800px |
| artCategoryConfig | featuredImage | 16:10 aspect ratio, ~1200x750px |
| lifestyleConfig | articles[].image | 2:3 aspect ratio, ~600x900px |
| designConfig | items[].image | 1:1 aspect ratio, ~600x600px |
| greenTribeConfig | members[].avatar, videoPoster | Avatar: 1:1 ~200x200px, Poster: 16:9 |
| authorsConfig | authors[].avatar | 1:1 aspect ratio, ~300x300px |
| instagramGalleryConfig | images[].image | 1:1 aspect ratio, ~400x400px |

## Design Specs

### Colors (from tailwind.config.js)

| Token | Value | Usage |
|-------|-------|-------|
| brand-black | #333 | Primary text |
| brand-linen | #f2ede7 | Background |
| brand-pure-black | #000 | Overlays |
| brand-text | #161616 | Body text |
| brand-light-gray | #b1b1b1 | Muted text |
| brand-dark-gray | #535353 | Secondary text |
| brand-border | #e5e5e5 | Borders |

### Fonts

- **Headings**: Oswald (weights: 200-700)
- **Body**: Roboto (weights: 100-900, includes italic)
- Both loaded from Google Fonts

### Animations

All animations use GSAP with ScrollTrigger. Key easing curves:
- `expo-out`: cubic-bezier(0.16, 1, 0.3, 1)
- `smooth`: cubic-bezier(0.65, 0, 0.35, 1)
- `dramatic`: cubic-bezier(0.85, 0, 0.15, 1)

## Notes

- Each section returns `null` when its config fields are empty, so the template renders a blank page until config is populated.
- CustomCursor and NoiseOverlay are pure visual effects; they have no configurable content.
- The custom cursor is automatically disabled on touch devices.
- All animations respect `prefers-reduced-motion: reduce`.
- The `lifestyleConfig.articles` array requires `rotation` and `position` fields for the scattered card layout. Typical values: rotation -8 to 8, position.x 0-250, position.y -30 to 50.
- The `designConfig.items` array uses a `size` field ("normal", "wide", "tall") for the mosaic grid layout.

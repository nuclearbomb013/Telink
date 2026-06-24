import { describe, it, expect } from 'vitest';
import {
  siteConfig,
  navigationConfig,
  heroConfig,
  latestArticlesConfig,
  artCategoryConfig,
  lifestyleConfig,
  designConfig,
  greenTribeConfig,
  authorsConfig,
  instagramGalleryConfig,
  footerConfig,
} from '@/config';

describe('Site Config', () => {
  it('has required fields', () => {
    expect(siteConfig.title).toBe('TechInk - 技术交流社区');
    expect(siteConfig.language).toBe('zh-CN');
    expect(siteConfig.description).toBeTruthy();
  });
});

describe('Navigation Config', () => {
  it('has correct brand name', () => {
    expect(navigationConfig.brandName).toBe('TechInk');
  });

  it('has navigation links', () => {
    expect(navigationConfig.links.length).toBeGreaterThanOrEqual(6);
    expect(navigationConfig.links[0].label).toBe('首页');
    expect(navigationConfig.links[0].href).toBe('/');
  });

  it('has search configuration', () => {
    expect(navigationConfig.searchPlaceholder).toBeTruthy();
    expect(navigationConfig.searchAriaLabel).toBe('搜索');
  });
});

describe('Hero Config', () => {
  it('has required hero content', () => {
    expect(heroConfig.titleLine1).toBe('探索技术的');
    expect(heroConfig.titleLine2).toBe('无限可能');
    expect(heroConfig.ctaText).toBe('开始探索');
    expect(heroConfig.image).toBe('/images/hero-code.webp');
  });
});

describe('Latest Articles Config', () => {
  it('has section title', () => {
    expect(latestArticlesConfig.sectionTitle).toBe('最新文章');
  });

  it('has at least 3 articles', () => {
    expect(latestArticlesConfig.articles.length).toBeGreaterThanOrEqual(3);
  });

  it('each article has required fields', () => {
    for (const article of latestArticlesConfig.articles) {
      expect(article.id).toBeGreaterThan(0);
      expect(article.title).toBeTruthy();
      expect(article.category).toBeTruthy();
      expect(article.slug).toBeTruthy();
    }
  });
});

describe('Art Category Config', () => {
  it('has categories', () => {
    expect(artCategoryConfig.categories.length).toBeGreaterThanOrEqual(4);
  });

  it('has events', () => {
    expect(artCategoryConfig.events.length).toBeGreaterThanOrEqual(1);
    expect(artCategoryConfig.events[0].title).toBeTruthy();
  });

  it('has featured content', () => {
    expect(artCategoryConfig.featuredTitle).toBeTruthy();
    expect(artCategoryConfig.featuredCtaText).toBe('阅读全文');
  });
});

describe('Lifestyle/Community Config', () => {
  it('has articles', () => {
    expect(lifestyleConfig.articles.length).toBeGreaterThanOrEqual(3);
  });

  it('each article has position data', () => {
    for (const article of lifestyleConfig.articles) {
      expect(article.rotation).toBeDefined();
      expect(article.position.x).toBeDefined();
      expect(article.position.y).toBeDefined();
    }
  });
});

describe('Design Config', () => {
  it('has design items', () => {
    expect(designConfig.items.length).toBeGreaterThanOrEqual(4);
  });

  it('each item has valid size', () => {
    const validSizes = ['wide', 'normal', 'tall'];
    for (const item of designConfig.items) {
      expect(validSizes).toContain(item.size);
    }
  });
});

describe('Developers Config', () => {
  it('has section title', () => {
    expect(greenTribeConfig.sectionTitle).toBe('开发者中心');
  });

  it('has members', () => {
    expect(greenTribeConfig.members.length).toBeGreaterThanOrEqual(2);
  });

  it('each member has required fields', () => {
    for (const member of greenTribeConfig.members) {
      expect(member.name).toBeTruthy();
      expect(member.role).toBeTruthy();
    }
  });
});

describe('Authors Config', () => {
  it('has authors', () => {
    expect(authorsConfig.authors.length).toBeGreaterThanOrEqual(3);
  });

  it('each author has social links', () => {
    for (const author of authorsConfig.authors) {
      expect(author.social).toBeDefined();
      expect(author.articles).toBeGreaterThan(0);
    }
  });
});

describe('Gallery Config', () => {
  it('has images', () => {
    expect(instagramGalleryConfig.images.length).toBeGreaterThanOrEqual(5);
  });

  it('has handle', () => {
    expect(instagramGalleryConfig.handle).toBe('@techink_dev');
  });
});

describe('Footer Config', () => {
  it('has required sections', () => {
    expect(footerConfig.categories.length).toBeGreaterThanOrEqual(3);
    expect(footerConfig.pages.length).toBeGreaterThanOrEqual(3);
    expect(footerConfig.legalLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('has copyright text', () => {
    expect(footerConfig.copyright).toContain('2026');
    expect(footerConfig.copyright).toContain('TechInk');
  });
});

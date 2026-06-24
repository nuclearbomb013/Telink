import { describe, expect, it } from 'vitest';
import type { Article } from '@/services/articles.types';
import type { MarkdownDocument } from '@/services/reader.types';
import {
  buildArticleDiscoveryStats,
  buildRelatedArticles,
  buildArticleReaderGuide,
  buildArticleSearchPresentation,
  discoverArticles,
  isReportArticle,
  type ArticleDiscoveryFilters,
} from '@/lib/articleDiscovery';

const baseFilters: ArticleDiscoveryFilters = {
  query: '',
  category: '',
  tag: '',
  mode: 'all',
  sort: 'newest',
};

const articles: Article[] = [
  {
    id: 1,
    title: 'AI 趋势报告 2026',
    subtitle: '年度研究和市场洞察',
    image: '',
    category: '人工智能',
    excerpt: '聚焦模型落地趋势与企业采用情况。',
    content: '这是正文内容，包含大量关于 AI 趋势和模型应用的分析。',
    tags: ['报告', 'AI'],
    publishDate: '2026-06-01',
    readTime: 12,
  },
  {
    id: 2,
    title: 'React 性能优化实战',
    subtitle: '前端工程经验总结',
    image: '',
    category: '前端开发',
    excerpt: '围绕渲染、缓存和拆分的落地经验。',
    content: '文章正文讲解如何优化 React 应用中的渲染性能。',
    tags: ['React', '性能'],
    publishDate: '2026-06-05',
    readTime: 8,
  },
  {
    id: 3,
    title: '数据库选型白皮书',
    subtitle: 'OLTP 与分析型场景比较',
    image: '',
    category: '架构设计',
    excerpt: '从一致性、扩展性与成本维度比较数据库方案。',
    content: '白皮书正文会深入比较多种数据库技术路线。',
    tags: ['白皮书', '数据库'],
    publishDate: '2026-05-20',
    readTime: 16,
  },
];

describe('articleDiscovery', () => {
  it('detects report-like articles by keywords', () => {
    expect(isReportArticle(articles[0])).toBe(true);
    expect(isReportArticle(articles[1])).toBe(false);
    expect(isReportArticle(articles[2])).toBe(true);
  });

  it('builds stats for categories, tags and report counts', () => {
    const stats = buildArticleDiscoveryStats(articles);
    expect(stats.total).toBe(3);
    expect(stats.reportCount).toBe(2);
    expect(stats.articleCount).toBe(1);
    expect(stats.categories[0]).toMatchObject({ count: 1 });
    expect(stats.tags.find(tag => tag.value === '报告')?.count).toBe(1);
  });

  it('filters report mode correctly', () => {
    const results = discoverArticles(articles, { ...baseFilters, mode: 'report' });
    expect(results).toHaveLength(2);
    expect(results.every(isReportArticle)).toBe(true);
  });

  it('filters by category and tag', () => {
    const results = discoverArticles(articles, {
      ...baseFilters,
      category: '前端开发',
      tag: 'React',
    });
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('React');
  });

  it('uses search relevance before other sorts', () => {
    const results = discoverArticles(articles, {
      ...baseFilters,
      query: '白皮书 数据库',
      sort: 'relevance',
    });
    expect(results[0].title).toContain('白皮书');
  });

  it('sorts by read time when requested', () => {
    const results = discoverArticles(articles, {
      ...baseFilters,
      sort: 'readTime',
    });
    expect(results[0].readTime).toBe(16);
  });

  it('builds highlighted presentation for search results', () => {
    const presentation = buildArticleSearchPresentation(articles[0], '趋势 报告');
    expect(presentation.titleHtml).toContain('<mark');
    expect(presentation.matchLabel).toBeTruthy();
    expect(presentation.excerptHtml).toContain('<mark');
  });

  it('builds reader guide for report-like article', () => {
    const document: MarkdownDocument = {
      html: '<p>summary</p>',
      toc: [
        { id: 'a', text: '概览', level: 1 },
        { id: 'b', text: '核心结论', level: 2 },
        { id: 'c', text: '行业趋势', level: 2 },
      ],
      readingTime: 12,
      summary: {
        lead: '报告摘要',
        keyPoints: ['要点一'],
        sectionTitles: ['概览', '核心结论', '行业趋势'],
      },
    };

    const guide = buildArticleReaderGuide(articles[0], document);
    expect(guide.audience).toContain('趋势');
    expect(guide.outcome).toContain('12');
    expect(guide.recommendedSections).toHaveLength(3);
  });

  it('builds related articles by shared tags and category', () => {
    const related = buildRelatedArticles(articles[0], articles);
    expect(related).toHaveLength(1);
    expect(related[0].reason).toContain('同为报告型内容');
  });
});

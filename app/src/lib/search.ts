/**
 * Search Utility - 搜索工具
 *
 * 使用 Fuse.js 实现全文搜索功能
 */

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否包含所有匹配项 */
  includeAllMatches?: boolean;
  /** 最小匹配分数 (0-1) */
  minMatchScore?: number;
}

/**
 * 可搜索的数据结构
 */
export interface SearchableItem {
  [key: string]: any;
}

/**
 * 搜索结果
 */
export interface SearchResult<T extends SearchableItem> {
  item: T;
  score?: number;
  matches?: Array<{
    key: string;
    value: string;
    indices: Array<[number, number]>;
  }>;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<SearchOptions> = {
  caseSensitive: false,
  includeAllMatches: true,
  minMatchScore: 0.3,
};

/**
 * 简单的文本搜索函数
 * 不依赖外部库，实现基础的模糊搜索功能
 *
 * @param data - 要搜索的数据数组
 * @param query - 搜索关键词
 * @param keys - 要搜索的键名数组
 * @param options - 搜索选项
 * @returns 搜索结果数组
 *
 * @example
 * ```typescript
 * const posts = [
 *   { title: 'React Hooks 教程', content: '学习 React Hooks...', tags: ['react', 'hooks'] },
 *   { title: 'TypeScript 入门', content: 'TypeScript 基础教程...', tags: ['typescript'] }
 * ];
 *
 * const results = simpleSearch(posts, 'React', ['title', 'content', 'tags']);
 * ```
 */
export function simpleSearch<T extends SearchableItem>(
  data: T[],
  query: string,
  keys: Array<keyof T>,
  options: SearchOptions = {}
): SearchResult<T>[] {
  if (!query || query.trim() === '') {
    return data.map((item) => ({ item }));
  }

  const config = { ...DEFAULT_OPTIONS, ...options };
  const searchTerm = config.caseSensitive ? query.trim() : query.trim().toLowerCase();
  const results: SearchResult<T>[] = [];

  for (const item of data) {
    const matches: SearchResult<T>['matches'] = [];
    let bestScore = 0;

    for (const key of keys) {
      const value = item[key];
      if (value === null || value === undefined) continue;

      // 处理数组类型（如 tags）
      const values = Array.isArray(value) ? value : [value] as any[];

      for (const v of values) {
        const textValue = String(v);
        const searchText = config.caseSensitive ? textValue : textValue.toLowerCase();

        // 计算匹配分数
        const score = calculateScore(searchTerm, searchText);

        if (score > 0 && score >= config.minMatchScore) {
          // 查找匹配位置
          const indices = findMatches(searchTerm, searchText);

          if (indices.length > 0) {
            matches.push({
              key: String(key),
              value: textValue,
              indices,
            });
          }

          bestScore = Math.max(bestScore, score);
        }
      }
    }

    if (matches.length > 0 || bestScore > 0) {
      results.push({
        item,
        score: bestScore,
        matches: config.includeAllMatches ? matches : matches.slice(0, 1),
      });
    }
  }

  // 按分数排序
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * 计算搜索词和文本的匹配分数
 */
function calculateScore(searchTerm: string, searchText: string): number {
  if (searchText.includes(searchTerm)) {
    // 完全匹配
    const position = searchText.indexOf(searchTerm);
    const positionScore = 1 - position / searchText.length; // 越靠前分数越高
    return 0.8 + 0.2 * positionScore;
  }

  // 检查是否包含所有单词
  const searchWords = searchTerm.split(/\s+/).filter(Boolean);
  const matchedWords = searchWords.filter((word) => searchText.includes(word));

  if (matchedWords.length === searchWords.length) {
    return 0.6;
  }

  if (matchedWords.length > 0) {
    return 0.3 * (matchedWords.length / searchWords.length);
  }

  // 模糊匹配 - 检查字符序列
  if (isFuzzyMatch(searchTerm, searchText)) {
    return 0.4;
  }

  return 0;
}

/**
 * 查找所有匹配位置
 */
function findMatches(searchTerm: string, searchText: string): Array<[number, number]> {
  const indices: Array<[number, number]> = [];
  let position = searchText.indexOf(searchTerm);

  while (position !== -1) {
    indices.push([position, position + searchTerm.length - 1]);
    position = searchText.indexOf(searchTerm, position + 1);
  }

  return indices;
}

/**
 * 模糊匹配检查
 */
function isFuzzyMatch(searchTerm: string, searchText: string): boolean {
  // 简单的字符序列匹配
  let searchIndex = 0;
  let textIndex = 0;

  while (searchIndex < searchTerm.length && textIndex < searchText.length) {
    if (searchTerm[searchIndex] === searchText[textIndex]) {
      searchIndex++;
    }
    textIndex++;
  }

  return searchIndex === searchTerm.length;
}

/**
 * 高亮匹配文本
 *
 * @param text - 原始文本
 * @param query - 搜索词
 * @param highlightClass - 高亮样式类名
 * @returns 高亮后的 HTML 字符串
 */
export function highlightMatch(
  text: string,
  query: string,
  highlightClass: string = 'bg-yellow-200 text-brand-text'
): string {
  if (!query || query.trim() === '') {
    return escapeHtml(text);
  }

  const escapedText = escapeHtml(text);
  const searchWords = query.trim().split(/\s+/).filter(Boolean);

  let result = escapedText;
  for (const word of searchWords) {
    const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
    result = result.replace(
      regex,
      `<mark class="${highlightClass}">$1</mark>`
    );
  }

  return result;
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

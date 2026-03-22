/**
 * Date Utilities - 时间格式化工具函数
 *
 * 提供统一的时间格式化功能，避免代码重复
 */

/**
 * 时间单位常量（毫秒）
 */
const TIME_UNITS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

/**
 * 格式化相对时间
 * 将时间戳转换为人类可读的相对时间字符串
 *
 * @param timestamp - 时间戳（毫秒）
 * @returns 相对时间字符串，如 "刚刚"、"5分钟前"、"3天前"
 *
 * @example
 * formatRelativeTime(Date.now() - 30000) // "刚刚"
 * formatRelativeTime(Date.now() - 3600000) // "1 小时前"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  // 未来时间处理
  if (diff < 0) {
    return formatDate(timestamp);
  }

  if (diff < TIME_UNITS.MINUTE) return '刚刚';
  if (diff < TIME_UNITS.HOUR) return `${Math.floor(diff / TIME_UNITS.MINUTE)} 分钟前`;
  if (diff < TIME_UNITS.DAY) return `${Math.floor(diff / TIME_UNITS.HOUR)} 小时前`;
  if (diff < TIME_UNITS.WEEK) return `${Math.floor(diff / TIME_UNITS.DAY)} 天前`;
  if (diff < TIME_UNITS.MONTH) return `${Math.floor(diff / TIME_UNITS.WEEK)} 周前`;
  if (diff < TIME_UNITS.YEAR) return `${Math.floor(diff / TIME_UNITS.MONTH)} 个月前`;

  return `${Math.floor(diff / TIME_UNITS.YEAR)} 年前`;
}

/**
 * 格式化简短相对时间
 * 只显示分钟、小时、天，不显示周和月
 *
 * @param timestamp - 时间戳（毫秒）
 * @returns 简短相对时间字符串
 */
export function formatShortRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0) return formatDate(timestamp);
  if (diff < TIME_UNITS.MINUTE) return '刚刚';
  if (diff < TIME_UNITS.HOUR) return `${Math.floor(diff / TIME_UNITS.MINUTE)} 分钟前`;
  if (diff < TIME_UNITS.DAY) return `${Math.floor(diff / TIME_UNITS.HOUR)} 小时前`;

  return `${Math.floor(diff / TIME_UNITS.DAY)} 天前`;
}

/**
 * 格式化日期
 * 将时间戳转换为标准日期格式
 *
 * @param timestamp - 时间戳（毫秒）
 * @param format - 格式类型：'short' | 'long' | 'full'
 * @returns 格式化的日期字符串
 *
 * @example
 * formatDate(Date.now(), 'short') // "2024-01-15"
 * formatDate(Date.now(), 'long') // "2024年1月15日"
 * formatDate(Date.now(), 'full') // "2024年1月15日 14:30"
 */
export function formatDate(
  timestamp: number,
  format: 'short' | 'long' | 'full' = 'long'
): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  switch (format) {
    case 'short':
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    case 'full':
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    case 'long':
    default:
      return `${year}年${month}月${day}日`;
  }
}

/**
 * 格式化时间
 * 将时间戳转换为时间字符串
 *
 * @param timestamp - 时间戳（毫秒）
 * @returns 时间字符串，如 "14:30"
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间
 * 智能选择显示格式：
 * - 今天的消息显示时间
 * - 今年的消息显示月日
 * - 其他显示年月日
 *
 * @param timestamp - 时间戳（毫秒）
 * @returns 智能格式的日期时间字符串
 */
export function formatDateTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return formatTime(timestamp);
  }

  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isThisYear) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  return formatDate(timestamp, 'short');
}

/**
 * 计算阅读时间
 * 根据文本长度估算阅读时间
 *
 * @param text - 文本内容
 * @param wordsPerMinute - 每分钟阅读字数（默认 300）
 * @returns 阅读时间（分钟）
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 300): number {
  if (!text) return 0;
  // 中文按字符数，英文按单词数
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const totalWords = chineseChars + englishWords;
  return Math.ceil(totalWords / wordsPerMinute);
}

// 导出别名，保持向后兼容
export const formatTimeAgo = formatRelativeTime;
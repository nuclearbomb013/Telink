/**
 * Design Tokens
 *
 * 集中管理所有设计系统常量，确保整个应用的设计一致性。
 * 所有值都从 ARTSTYLE.md 设计指南中提取。
 *
 * @see ARTSTYLE.md - 完整设计系统文档
 */

// ============================================================
// 颜色系统
// ============================================================

/**
 * 品牌色彩
 */
export const BRAND_COLORS = {
  black: '#000000',
  linen: '#ffffff',
  pureBlack: '#000000',
  text: '#000000',
  lightGray: '#999999',
  darkGray: '#333333',
  border: '#000000',
} as const;

/**
 * E-ink 专用色彩
 */
export const INK_COLORS = {
  black: '#000000',
  dark: '#333333',
  medium: '#666666',
  light: '#999999',
  pale: '#cccccc',
  white: '#ffffff',
  paper: '#fafafa',
} as const;

/**
 * 透明度层级
 */
export const OPACITY = {
  full: 1,
  high: 0.9,
  medium: 0.6,
  low: 0.4,
  faint: 0.2,
  minimal: 0.1,
} as const;

/**
 * 灰度透明度（用于黑色/白色）
 */
export const GRAYSCALE_OPACITY = {
  black: {
    10: 'rgba(0, 0, 0, 0.1)',
    20: 'rgba(0, 0, 0, 0.2)',
    30: 'rgba(0, 0, 0, 0.3)',
    40: 'rgba(0, 0, 0, 0.4)',
    50: 'rgba(0, 0, 0, 0.5)',
    60: 'rgba(0, 0, 0, 0.6)',
  },
  white: {
    10: 'rgba(255, 255, 255, 0.1)',
    20: 'rgba(255, 255, 255, 0.2)',
    50: 'rgba(255, 255, 255, 0.5)',
    80: 'rgba(255, 255, 255, 0.8)',
    90: 'rgba(255, 255, 255, 0.9)',
    95: 'rgba(255, 255, 255, 0.95)',
  },
} as const;

// ============================================================
// 字体系统
// ============================================================

/**
 * 字体家族
 */
export const FONT_FAMILY = {
  oswald: ['Oswald', 'sans-serif'],
  roboto: ['Roboto', 'sans-serif'],
  mono: ['Courier New', 'monospace'],
} as const;

/**
 * 字号系统 (rem 单位)
 */
export const FONT_SIZE = {
  xs: '0.75rem',      // 12px - 标签/分类
  sm: '0.875rem',     // 14px - 辅助文本
  base: '1rem',       // 16px - 标准正文
  lg: '1.125rem',     // 18px - 引导文本
  xl: '1.25rem',      // 20px - 大正文
  '2xl': '1.5rem',    // 24px - 小标题
  '3xl': '1.875rem',  // 30px - 搜索框
  '4xl': '2.25rem',   // 36px - 卡片标题
  '5xl': '3rem',      // 48px - 副标题
  '6xl': '4.5rem',    // 72px - 章节标题
  '7xl': '5.625rem',  // 90px - Hero 主标题
} as const;

/**
 * 响应式字号映射
 */
export const RESPONSIVE_FONT_SIZE = {
  hero: 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl',
  sectionTitle: 'text-4xl lg:text-5xl xl:text-6xl',
  cardTitle: 'text-xl lg:text-2xl',
  navLogo: 'text-4xl lg:text-5xl',
  navLogoCompact: 'text-2xl',
  category: 'text-xs',
  description: 'text-base lg:text-lg',
} as const;

/**
 * 字重
 */
export const FONT_WEIGHT = {
  light: 300,
  normal: 400,
  medium: 500,
  bold: 700,
} as const;

/**
 * 字间距 (Letter Spacing)
 */
export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
  // 标题默认负字距
  titleDefault: '-0.02em',
} as const;

/**
 * 行高 (Line Height)
 */
export const LINE_HEIGHT = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
  // Hero 标题极紧凑
  hero: '1.15',
} as const;

// ============================================================
// 间距系统 (8px 网格)
// ============================================================

/**
 * 基础间距 (rem 单位)
 */
export const SPACING = {
  px: '0.0625rem',   // 1px
  '0.5': '0.125rem', // 2px
  '1': '0.25rem',    // 4px
  '2': '0.5rem',     // 8px
  '3': '0.75rem',    // 12px
  '4': '1rem',       // 16px
  '5': '1.25rem',    // 20px
  '6': '1.5rem',     // 24px
  '8': '2rem',       // 32px
  '10': '2.5rem',    // 40px
  '12': '3rem',      // 48px
  '16': '4rem',      // 64px
  '20': '5rem',      // 80px
  '24': '6rem',      // 96px
  '32': '8rem',      // 128px
} as const;

/**
 * 组件间距规范
 */
export const COMPONENT_SPACING = {
  // 章节间距
  sectionPadding: 'py-20 lg:py-32',
  sectionPaddingCompact: 'py-12 lg:py-20',
  sectionPaddingWide: 'py-24 lg:py-40',

  // 标题与内容
  titleToContent: 'mb-12 lg:mb-16',
  subtitleToContent: 'mb-8 lg:mb-12',

  // 元素间距
  elementSmall: 'mb-2',
  elementMedium: 'mb-4',
  elementLarge: 'mb-6',
  elementXL: 'mb-8',

  // 网格/弹性间距
  gapSmall: 'gap-4',
  gapMedium: 'gap-6',
  gapLarge: 'gap-8',
  gapXL: 'gap-12',

  // 响应式间距
  gapResponsive: 'gap-6 lg:gap-12',
  containerPadding: 'px-6 lg:px-12',
} as const;

/**
 * 容器宽度
 */
export const CONTAINER_WIDTH = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '1600px',  // 项目主容器宽度
  content: '896px', // max-w-4xl - 文章宽度
} as const;

// ============================================================
// 圆角系统
// ============================================================

/**
 * 圆角半径 - 全部为零保持几何感
 */
export const BORDER_RADIUS = {
  none: '0',
  // 所有预设都为 0
  xs: '0',
  sm: '0',
  md: '0',
  lg: '0',
  xl: '0',
  '2xl': '0',
  full: '0',
} as const;

// ============================================================
// 边框系统
// ============================================================

/**
 * 边框宽度
 */
export const BORDER_WIDTH = {
  none: '0',
  thin: '1px',
  normal: '2px',
  thick: '4px',
} as const;

/**
 * 边框样式
 */
export const BORDER_STYLE = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
} as const;

// ============================================================
// 阴影系统
// ============================================================

/**
 * E-ink 风格阴影
 */
export const SHADOW = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  pixel: '4px 4px 0 0 #000',
  pixelSm: '2px 2px 0 0 #000',
  pixelHover: '2px 2px 0 0 #000',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  // 投影效果
  dropLeft: 'drop-shadow(-4px 0 8px rgba(0,0,0,0.3))',
  dropRight: 'drop-shadow(4px 0 8px rgba(0,0,0,0.3))',
} as const;

// ============================================================
// 动画系统
// ============================================================

/**
 * 缓动函数
 */
export const EASING = {
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
  dramatic: 'cubic-bezier(0.85, 0, 0.15, 1)',
  power2Out: 'power2.out',
  power3Out: 'power3.out',
  power4Out: 'power4.out',
  elastic: 'elastic.out(1, 0.5)',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

/**
 * 动画持续时间 (秒)
 */
export const DURATION = {
  fast: 0.2,
  normal: 0.4,
  medium: 0.6,
  slow: 0.8,
  verySlow: 1.2,
} as const;

/**
 * 错开延迟 (秒)
 */
export const STAGGER = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
} as const;

/**
 * 过渡类名组合
 */
export const TRANSITION = {
  fast: 'transition-all duration-200 ease-out',
  normal: 'transition-all duration-300 ease-expo-out',
  medium: 'transition-all duration-500 ease-expo-out',
  slow: 'transition-all duration-700 ease-expo-out',
  color: 'transition-colors duration-300 ease-out',
  transform: 'transition-transform duration-500 ease-expo-out',
} as const;

// ============================================================
// 断点系统
// ============================================================

/**
 * 响应式断点 (px)
 */
export const BREAKPOINT = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * 断点媒体查询
 */
export const MEDIA_QUERY = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

// ============================================================
// Z-index 层级
// ============================================================

/**
 * 元素层级
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  // 项目特定
  noiseOverlay: 9999,
  cursorRing: 9999,
  cursorDot: 10000,
  searchOverlay: 100,
} as const;

// ============================================================
// 特效组合
// ============================================================

/**
 * E-ink 图片效果
 */
export const IMAGE_EFFECT = {
  grayscale: 'grayscale(100%) contrast(1.2)',
  grayscaleHover: 'grayscale(100%) contrast(1.2)',
  hoverScale: 'hover:scale-110',
  transition: 'transition-transform duration-700 ease-expo-out',
} as const;

/**
 * 毛玻璃效果
 */
export const GLASS_EFFECT = {
  base: 'bg-white/95 backdrop-blur-md border border-black/10',
  nav: 'bg-white/95 backdrop-blur-md border-b border-black/30',
  card: 'bg-white/95 backdrop-blur-xl',
} as const;

/**
 * 像素边框效果
 */
export const PIXEL_BORDER = {
  base: 'border-2 border-black shadow-[4px_4px_0_0_#000]',
  hover: 'hover:shadow-[2px_2px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5',
  transition: 'transition-all duration-200 ease-out',
} as const;

// ============================================================
// Tailwind 类组合（常用）
// ============================================================

/**
 * 按钮样式
 */
export const BUTTON_CLASSES = {
  primary: `
    px-6 py-3
    bg-black text-white
    font-oswald uppercase tracking-wider
    border-2 border-black
    transition-all duration-300
    hover:bg-white hover:text-black
    cursor-hover
  `,

  outline: `
    px-6 py-3
    bg-transparent text-black
    font-oswald uppercase tracking-wider
    border-2 border-black
    transition-all duration-300
    hover:bg-black hover:text-white
    cursor-hover
  `,

  apple: `
    px-6 py-3
    bg-white/90 backdrop-blur-sm
    border border-black/20
    shadow-md rounded-full
    transition-all duration-300
    hover:scale-105 hover:shadow-xl
    hover:bg-black hover:text-white
  `,

  navTriangle: `
    w-0 h-0
    border-t-[40px] border-t-transparent
    border-b-[40px] border-b-transparent
    transition-all duration-300
    hover:scale-110
  `,
} as const;

/**
 * 导航样式
 */
export const NAV_CLASSES = {
  logo: `
    font-oswald font-light tracking-widest
    text-black hover:text-dark-gray
    transition-colors duration-300
    cursor-hover
  `,

  link: `
    font-roboto text-xs uppercase tracking-wider
    text-dark-gray hover:text-black
    transition-colors duration-300
    relative liquid-underline cursor-hover
  `,

  bar: `
    fixed top-0 left-0 right-0 z-50
    transition-all duration-700 ease-expo-out
  `,

  barNormal: 'py-6',
  barScrolled: 'py-3 glass border-b border-black/30',
} as const;

/**
 * 卡片样式
 */
export const CARD_CLASSES = {
  base: `
    group cursor-hover
    relative
    transition-all duration-500
    hover:scale-105 hover:z-10
  `,

  imageContainer: `
    relative overflow-hidden
    bg-black
    transition-all duration-500
    hover:scale-105
  `,

  image: `
    w-full h-full object-cover
    transition-transform duration-700
    grayscale contrast-125
    hover:scale-110
  `,

  category: `
    font-roboto text-xs
    uppercase tracking-wider
    text-dark-gray
  `,

  title: `
    font-oswald font-light
    text-xl lg:text-2xl
    text-black
    mt-1
    leading-tight
  `,

  description: `
    font-roboto text-sm
    text-dark-gray
    mt-1
  `,
} as const;

/**
 * 标题样式
 */
export const TITLE_CLASSES = {
  hero: `
    font-oswald font-light
    text-4xl sm:text-5xl lg:text-6xl xl:text-7xl
    text-black
    leading-[1.15]
    tracking-tight
  `,

  section: `
    font-oswald font-light
    text-4xl lg:text-5xl xl:text-6xl
    text-black
    leading-tight
    tracking-tight
  `,

  card: `
    font-oswald font-light
    text-xl lg:text-2xl
    text-black
    leading-tight
  `,

  label: `
    font-roboto text-xs
    uppercase tracking-wider
    text-dark-gray
  `,
} as const;

/**
 * 输入框样式
 */
export const INPUT_CLASSES = {
  search: `
    w-full bg-transparent
    border-b-2 border-black
    py-4
    text-3xl lg:text-5xl
    font-oswald font-light
    placeholder:text-light-gray
    focus:outline-none
  `,

  standard: `
    w-full bg-transparent
    border-b border-black
    py-3
    text-base
    font-roboto
    placeholder:text-light-gray
    focus:outline-none
    focus:border-b-2
    transition-colors duration-300
  `,
} as const;

// ============================================================
// TypeScript 类型
// ============================================================

/**
 * 颜色类型
 */
export type Color =
  | keyof typeof BRAND_COLORS
  | keyof typeof INK_COLORS
  | 'transparent';

/**
 * 字体家族类型
 */
export type FontFamily = keyof typeof FONT_FAMILY;

/**
 * 字号类型
 */
export type FontSize = keyof typeof FONT_SIZE;

/**
 * 间距类型
 */
export type Spacing = keyof typeof SPACING;

/**
 * 断点类型
 */
export type Breakpoint = keyof typeof BREAKPOINT;

/**
 * 缓动函数类型
 */
export type Easing = keyof typeof EASING;

/**
 * 持续时间类型
 */
export type Duration = keyof typeof DURATION;

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取响应式值
 */
export function getResponsiveValue<T extends Record<string, any>>(
  tokens: T,
  _breakpoint: Breakpoint = 'md'
): string {
  // 简化版，实际可以根据断点返回对应值
  return tokens.md || tokens.base || Object.values(tokens)[0];
}

/**
 * 生成渐变类名
 */
export function gradientClass(
  direction: 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl',
  from: string,
  to: string
): string {
  return `bg-gradient-to-${direction} from-${from} to-${to}`;
}

/**
 * 生成透明度颜色
 */
export function withOpacity(
  color: keyof typeof BRAND_COLORS | keyof typeof INK_COLORS,
  opacity: keyof typeof OPACITY
): string {
  const colorValue = BRAND_COLORS[color as keyof typeof BRAND_COLORS] ||
                     INK_COLORS[color as keyof typeof INK_COLORS];
  const opacityValue = OPACITY[opacity];
  return `rgba(${parseInt(colorValue.slice(1, 3), 16)}, ` +
         `${parseInt(colorValue.slice(3, 5), 16)}, ` +
         `${parseInt(colorValue.slice(5, 7), 16)}, ${opacityValue})`;
}

// ============================================================
// 导出默认配置
// ============================================================

/**
 * 默认设计令牌
 */
export const designTokens = {
  colors: {
    brand: BRAND_COLORS,
    ink: INK_COLORS,
    opacity: OPACITY,
  },
  typography: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    fontWeight: FONT_WEIGHT,
    letterSpacing: LETTER_SPACING,
    lineHeight: LINE_HEIGHT,
  },
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  borderWidth: BORDER_WIDTH,
  shadow: SHADOW,
  animation: {
    easing: EASING,
    duration: DURATION,
    stagger: STAGGER,
  },
  breakpoints: BREAKPOINT,
  zIndex: Z_INDEX,
} as const;

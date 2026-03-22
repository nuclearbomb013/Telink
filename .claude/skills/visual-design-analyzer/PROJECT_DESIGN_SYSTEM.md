# TechInk Web 设计系统文档

> 本文档由 Visual Design Analyzer 技能生成，记录 TechInk Web 项目的完整视觉设计系统。

---

## 一、设计风格概述

**TechInk** 是一个采用 **E-ink 墨水屏风格** 的技术交流社区网站。设计灵感来源于电子墨水显示屏的视觉效果，强调极简主义、单色美学和纸质阅读体验。

### 核心设计理念

1. **极简单色** - 仅使用黑白灰色调，模拟墨水屏显示效果
2. **纸质质感** - 通过微妙的纹理和噪点模拟真实纸张
3. **平滑过渡** - 所有交互都配备流畅的动画效果
4. **精致细节** - 微妙的阴影、边框和悬停效果
5. **功能优先** - 形式服务于内容和可读性

---

## 二、配色系统 (Color System)

### 2.1 主色调 - E-ink 墨水色系

| 变量名 | HEX 值 | HSL | RGB | 用途 |
|--------|--------|-----|-----|------|
| `--ink-black` | `#000000` | 0° 0% 0% | 0, 0, 0 | 主文本、按钮背景、边框 |
| `--ink-dark` | `#333333` | 0° 0% 20% | 51, 51, 51 | 次级文本、深色 UI 元素 |
| `--ink-medium` | `#666666` | 0° 0% 40% | 102, 102, 102 | 说明文字、图标 |
| `--ink-light` | `#999999` | 0° 0% 60% | 153, 153, 153 | 占位符文本、次要信息 |
| `--ink-pale` | `#CCCCCC` | 0° 0% 80% | 204, 204, 204 | 边框、分隔线 |
| `--ink-white` | `#FFFFFF` | 0° 0% 100% | 255, 255, 255 | 背景、反白文本 |
| `--ink-paper` | `#FAFAFA` | 0° 0% 98% | 250, 250, 250 | 纸色背景、卡片背景 |

### 2.2 shadcn/ui 语义色

```css
/* 基础颜色映射 - 全部映射到 E-ink 色系 */
--background: 0 0% 100%;      /* 白色背景 */
--foreground: 0 0% 0%;        /* 黑色前景 */
--primary: 0 0% 0%;           /* 主色 - 纯黑 */
--primary-foreground: 0 0% 100%;  /* 主色前景 - 白色 */
--secondary: 0 0% 95%;        /* 次级色 - 浅灰 */
--secondary-foreground: 0 0% 0%;  /* 次级前景 - 黑色 */
--muted: 0 0% 90%;            /* 柔和背景 */
--muted-foreground: 0 0% 40%; /* 柔和前景 */
--accent: 0 0% 90%;           /* 强调背景 */
--accent-foreground: 0 0% 0%; /* 强调前景 */
--border: 0 0% 80%;           /* 边框颜色 */
--input: 0 0% 80%;            /* 输入框边框 */
--ring: 0 0% 0%;              /* 焦点环 - 黑色 */
```

### 2.3 Tailwind 配置映射

```javascript
// tailwind.config.js 中的颜色配置
colors: {
  'brand-black': '#000000',
  'brand-linen': '#ffffff',
  'brand-pure-black': '#000000',
  'brand-text': '#000000',
  'brand-light-gray': '#999999',
  'brand-dark-gray': '#333333',
  'brand-border': '#000000',

  // E-ink 专用色
  'ink-black': '#000000',
  'ink-dark': '#333333',
  'ink-medium': '#666666',
  'ink-light': '#999999',
  'ink-pale': '#cccccc',
  'ink-white': '#ffffff',
  'ink-paper': '#fafafa',
}
```

---

## 三、排版系统 (Typography)

### 3.1 字体栈

| 用途 | 字体 | 回退方案 | 来源 |
|------|------|----------|------|
| 标题 | `Oswald` | `sans-serif` | Google Fonts |
| 正文 | `Roboto` | `sans-serif` | Google Fonts |
| 代码 | `Courier New` | `monospace` | 系统字体 |

### 3.2 字号层级 (Type Scale)

```css
/* 基于 Tailwind 的默认比例 */
--text-xs: 0.75rem;     /* 12px - 辅助文字、标签 */
--text-sm: 0.875rem;    /* 14px - 次要信息、元数据 */
--text-base: 1rem;      /* 16px - 正文 */
--text-lg: 1.125rem;    /* 18px - 小标题 */
--text-xl: 1.25rem;     /* 20px - 卡片标题 */
--text-2xl: 1.5rem;     /* 24px - Section 标题 */
--text-3xl: 1.875rem;   /* 30px - 页面标题 */
--text-4xl: 2.25rem;    /* 36px - Hero 标题 */
--text-5xl: 3rem;       /* 48px - 大标题 */
--text-6xl: 3.75rem;    /* 60px - 超大标题 */
--text-7xl: 4.5rem;     /* 72px - 展示标题 */
```

### 3.3 字重方案

```css
/* Oswald (标题字体) */
--font-weight-light: 300;    /* Hero 标题主行 */
--font-weight-normal: 400;   /* 标准标题 */
--font-weight-medium: 500;   /* 强调标题 */
--font-weight-semibold: 600; /* 强调文字 */
--font-weight-bold: 700;     /* 主标题、重要元素 */

/* Roboto (正文字体) */
--font-weight-light: 300;    /* 精致文本 */
--font-weight-normal: 400;   /* 标准正文 */
--font-weight-medium: 500;   /* 强调文字 */
--font-weight-bold: 700;     /* 粗体 */
```

### 3.4 字母间距

```css
/* 标题 - 紧凑 */
--tracking-tight: -0.02em;   /* h1-h6 默认 */

/* 正文 - 标准 */
--tracking-normal: 0;        /* 正文默认 */

/* 特殊 - 加宽 */
--tracking-wider: 0.05em;    /* 大写文本、标签 */
--tracking-widest: 0.1em;    /* 日期、元数据 */
```

### 3.5 行高

```css
--leading-tight: 1.15;       /* 标题行高 */
--leading-normal: 1.5;       /* 正文行高 */
--leading-relaxed: 1.625;    /* 宽松行高 */
```

---

## 四、组件风格 (Component Styles)

### 4.1 按钮样式

#### 4.1.1 实心按钮 (btn-ink)

```css
.btn-ink {
  @apply px-6 py-3 bg-black text-white font-oswald uppercase tracking-wider;
  border: 2px solid #000;
  transition: all 0.2s ease-out;
}

.btn-ink:hover {
  @apply bg-white text-black;
}
```

#### 4.1.2 轮廓按钮 (btn-ink-outline)

```css
.btn-ink-outline {
  @apply px-6 py-3 bg-transparent text-black font-oswald uppercase tracking-wider;
  border: 2px solid #000;
  transition: all 0.2s ease-out;
}

.btn-ink-outline:hover {
  @apply bg-black text-white;
}
```

#### 4.1.3 按钮状态

| 状态 | 背景 | 文本 | 边框 |
|------|------|------|------|
| Default | `#000` | `#FFF` | `#000` |
| Hover | `#FFF` | `#000` | `#000` |
| Active | `#333` | `#FFF` | `#000` |
| Disabled | `#CCC` | `#999` | `#CCC` |

### 4.2 卡片样式

```css
/* 标准文章卡片 */
.article-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
  transition:
    box-shadow 0.5s ease,
    transform 0.5s ease;
}

.article-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}
```

#### 卡片结构

```
┌─────────────────────────────┐
│  [图片区域 - aspect ratio]   │
│  ┌────────────┐             │
│  │ 分类标签    │             │
│  └────────────┘             │
├─────────────────────────────┤
│  标题 (Oswald)              │
│  副标题 (可选)               │
│  摘要 (Roboto, 2-4 行)       │
│  ─────────────────────────  │
│  作者 | 日期 | 阅读时间      │
│  #标签 1 #标签 2 #标签 3     │
└─────────────────────────────┘
```

### 4.3 输入框样式

```css
.input {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #CCCCCC;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}
```

### 4.4 导航栏样式

```css
.navigation {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-link {
  font-family: 'Roboto', sans-serif;
  font-size: 0.875rem;
  color: #000;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #333;
}
```

### 4.5 像素风格边框 (Pixel Border)

```css
.pixel-border {
  border: 2px solid #000;
  box-shadow: 4px 4px 0 0 #000;
  transition: box-shadow 0.2s ease-out, transform 0.2s ease-out;
}

.pixel-border:hover {
  box-shadow: 2px 2px 0 0 #000;
  transform: translate(2px, 2px);
}
```

---

## 五、动画系统 (Animation System)

### 5.1 缓动函数 (Easing Functions)

```css
/* 核心缓动函数 - 来自 tailwind.config.js */
--ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);    /* Expo out - 平滑自然减速 */
--ease-smooth: cubic-bezier(0.65, 0, 0.35, 1);     /* Smooth - 对称平滑 */
--ease-dramatic: cubic-bezier(0.85, 0, 0.15, 1);   /* Dramatic - 戏剧性缓动 */

/* GSAP 缓动 */
--ease-power3-out: power3.out;    /* 强结束 */
--ease-power4-out: power4.out;    /* 非常强的结束 */
--ease-power2-out: power2.out;    /* 中等结束 */
```

### 5.2 持续时间预设

| 名称 | 秒 | 毫秒 | 用途 |
|------|-----|------|------|
| `fast` | 0.2s | 200ms | 快速反馈、按钮悬停 |
| `normal` | 0.4s | 400ms | 标准过渡 |
| `medium` | 0.6s | 600ms | 中等动画 |
| `slow` | 0.8s | 800ms | 慢速揭示 |
| `verySlow` | 1.2s | 1200ms | 大型元素动画 |

### 5.3 光标动画配置

```typescript
// 来自 animation.constants.ts
CURSOR_CONFIG = {
  dotSpeed: 0.2,        // 光标点插值速度
  ringSpeed: 0.1,       // 光环插值速度
  hoverSize: 48,        // 悬停时光环尺寸 (px)
  defaultSize: 32,      // 默认光环尺寸 (px)
  dotSize: 6,           // 光标点尺寸 (px)
}
```

### 5.4 揭示动画配置

```typescript
REVEAL_CONFIG = {
  startY: 30,           // 初始 Y 偏移 (px)
  duration: 0.8,        // 揭示动画时长 (s)
  ease: 'power3.out',   // 缓动函数
  triggerStart: 'top 85%', // 滚动触发位置
}
```

### 5.5 Hero 区块动画配置

```typescript
HERO_CONFIG = {
  unfoldDuration: 1.5,   // 3D 展开时长 (s)
  unfoldEase: 'expo.out',// 展开缓动
  tiltIntensity: 5,      // 最大倾斜角度 (deg)
  tiltDuration: 0.5,     // 倾斜时长 (s)
  tiltEase: 'power2.out',// 倾斜缓动
  parallaxDistance: -150,// 视差滚动距离 (px)
  titleDrift: 50,        // 标题水平漂移 (px)
}
```

### 5.6 磁性效果配置

```typescript
MAGNETIC_CONFIG = {
  magnetRadius: 80,              // 最大作用范围 (px)
  magnetStrength: 0.3,           // 磁力强度 (0-1)
  recoveryDuration: 0.5,         // 恢复时长 (s)
  recoveryEase: 'elastic.out(1, 0.5)', // 恢复缓动
}
```

### 5.7 关键帧动画

```css
/* 漂浮动画 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 微脉冲动画 */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* 噪点纹理动画 */
@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -25%); }
  40% { transform: translate(-5%, 25%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 15%); }
  80% { transform: translate(3%, 35%); }
  90% { transform: translate(-10%, 10%); }
}

/* 墨水刷新效果 */
@keyframes ink-refresh {
  0% { opacity: 1; }
  50% { opacity: 0.8; filter: invert(1); }
  100% { opacity: 1; }
}

/* 光标闪烁 */
@keyframes caret-blink {
  0%, 70%, 100% { opacity: 1; }
  20%, 50% { opacity: 0; }
}

/* 手风琴展开 */
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

---

## 六、布局系统 (Layout System)

### 6.1 间距方案 (Spacing Scale)

| Tailwind | REM | PX | 用途 |
|----------|-----|----|------|
| `space-1` | 0.25rem | 4px | 微小间距 |
| `space-2` | 0.5rem | 8px | 紧密元素 |
| `space-3` | 0.75rem | 12px | 小组件 |
| `space-4` | 1rem | 16px | 标准内边距 |
| `space-6` | 1.5rem | 24px | 中等间距 |
| `space-8` | 2rem | 32px | Section 内边距 |
| `space-12` | 3rem | 48px | 大间距 |
| `space-16` | 4rem | 64px | Section 间距 |
| `space-20` | 5rem | 80px | 页面间距 |
| `space-32` | 8rem | 128px | 超大间距 |

### 6.2 断点设置 (Breakpoints)

| 断点 | 最小宽度 | 用途 |
|------|----------|------|
| `sm` | 640px | 大手机/小平板 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 小屏幕笔记本 |
| `xl` | 1280px | 桌面显示器 |
| `2xl` | 1536px | 大屏幕 |

### 6.3 容器宽度

```css
.max-w-prose { max-width: 65ch; }     /* 文章阅读 */
.max-w-screen-sm { max-width: 640px; }
.max-w-screen-md { max-width: 768px; }
.max-w-screen-lg { max-width: 1024px; }
.max-w-screen-xl { max-width: 1280px; }
.max-w-screen-2xl { max-width: 1536px; }
```

### 6.4 圆角方案

```css
/* 所有圆角均为 0 - 体现像素风格 */
--radius-sm: 0;
--radius-md: 0;
--radius-lg: 0;
--radius-xl: 0;
--radius-full: 9999px; /* 仅用于圆形元素 */
```

### 6.5 Z-index 层级

```css
/* 层级系统 */
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal: 400;
--z-popover: 500;
--z-tooltip: 600;
--z-notification: 700;

/* 特殊层级 */
--z-noise: 9999;       /* 噪点覆盖层 */
--z-cursor-dot: 10000; /* 光标点 */
--z-cursor-ring: 9999; /* 光环 */
```

---

## 七、特殊效果 (Special Effects)

### 7.1 噪声纹理覆盖层

```css
.noise-overlay {
  position: fixed;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  width: 200%;
  height: 200%;
  background: transparent url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E") repeat;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.04;
  animation: grain 8s steps(10) infinite;
  mix-blend-mode: multiply;
}
```

### 7.2 自定义光标

```css
/* 光标点 - 小而精确 */
.cursor-dot {
  position: fixed;
  width: 6px;
  height: 6px;
  background: #000;
  border-radius: 50%;
  pointer-events: none;
  z-index: 10000;
  transition: transform 0.08s ease-out;
}

/* 光环 - 优雅扩展 */
.cursor-ring {
  position: fixed;
  width: 28px;
  height: 28px;
  border: 1.5px solid #000;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 悬停状态 */
.cursor-ring.hover {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.03);
}
```

### 7.3 纸张纹理背景

```css
body {
  background-color: #ffffff;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(0,0,0,0.02) 1px, transparent 1px),
    radial-gradient-circle at 75% 75%, rgba(0,0,0,0.02) 1px, transparent 1px);
  background-size: 4px 4px;
}
```

### 7.4 扫描线效果

```css
.scanlines::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
  pointer-events: none;
}
```

### 7.5 点阵纹理

```css
.dither-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.5' fill='rgba(0,0,0,0.1)'/%3E%3Ccircle cx='3' cy='3' r='0.5' fill='rgba(0,0,0,0.1)'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.5;
}
```

### 7.6 玻璃拟态 (E-ink 风格)

```css
.glass {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}
```

### 7.7 墨水风格图片悬停

```css
.img-hover-zoom {
  overflow: hidden;
  filter: contrast(1.1);
}

.img-hover-zoom img {
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  filter: grayscale(100%) contrast(1.2);
}

.img-hover-zoom:hover img {
  transform: scale(1.05);
}
```

### 7.8 液体下划线

```css
.liquid-underline {
  position: relative;
}

.liquid-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #000;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.liquid-underline:hover::after {
  width: 100%;
}
```

### 7.9 揭示动画

```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 7.10 卡片倾斜效果

```css
.card-tilt {
  transform-style: preserve-3d;
  perspective: 1000px;
}
```

### 7.11 分割文本动画

```css
.split-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(100%);
  transition:
    opacity 0.6s ease-out,
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.split-char.visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 八、水平滚动系统

```css
.horizontal-scroll {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.horizontal-scroll > * {
  scroll-snap-align: start;
  flex-shrink: 0;
}
```

---

## 九、Section 过渡效果

```css
/* Section 淡入效果 */
.section-fade {
  opacity: 0.95;
}

.section-fade.in-view {
  opacity: 1;
}
```

---

## 十、设计原则总结

1. **极简单色优先** - 仅使用黑白灰，避免彩色破坏整体感
2. **纸质阅读体验** - 通过纹理和对比度模拟真实纸张
3. **流畅的动画曲线** - 所有动画使用 `cubic-bezier(0.16, 1, 0.3, 1)` 确保平滑
4. **精致的细节** - 微妙的阴影、边框变化和悬停效果
5. **响应式设计** - 所有元素适配多种屏幕尺寸
6. **无障碍访问** - 考虑 `prefers-reduced-motion` 用户
7. **性能优化** - 使用 `will-change` 和硬件加速
8. **一致性** - 使用统一的常量文件和设计 Token

---

## 附录：配置文件引用

- **颜色配置**: `tailwind.config.js` (第 12-74 行)
- **动画配置**: `src/constants/animation.constants.ts`
- **字体配置**: `tailwind.config.js` (第 7-11 行)
- **CSS 变量**: `src/index.css` (第 6-45 行)
- **组件样式**: `src/index.css` (第 87-337 行)
- **缓动函数**: `tailwind.config.js` (第 136-140 行)
- **关键帧动画**: `tailwind.config.js` (第 88-126 行) 和 `src/index.css` (第 412-434 行)

---

*文档生成时间：2026-03-05*
*Visual Design Analyzer v1.0*

# TechInk Web - 美术风格设计指南

> 本文档详细记录 TechInk Web 项目的完整美术风格设计系统，用于指导后续的 vibe-coding 开发。

---

## 核心设计理念

### "E-ink Inspired Minimalism"（电子墨水启发的极简主义）

TechInk Web 的设计语言源于电子墨水屏（E-ink Display）的独特美学，结合现代网页设计的最佳实践，创造出既复古又前沿的视觉体验。

#### 三大核心原则

1. **单色高对比** - 严格的黑白灰配色，确保极致的可读性
2. **几何精确性** - 零圆角、直线条，营造科技感与秩序感
3. **墨水流动感** - 精心设计的缓动函数，模拟墨水在纸张上的自然流动

---

## 一、色彩系统

### 1.1 核心调色板

#### CSS 变量定义 (`src/index.css`)

```css
/* ===== 基础色彩系统 (HSL格式) ===== */
:root {
  /* 背景与前景 */
  --background: 0 0% 100%;         /* 纯白背景 #FFFFFF */
  --foreground: 0 0% 0%;           /* 纯黑前景 #000000 */

  /* 卡片系统 */
  --card: 0 0% 100%;               /* 卡片背景 - 纯白 */
  --card-foreground: 0 0% 0%;      /* 卡片文字 - 纯黑 */

  /* 主要操作元素 */
  --primary: 0 0% 0%;              /* 主色 - 纯黑 */
  --primary-foreground: 0 0% 100%;  /* 主色前景 - 纯白 */

  /* 次要元素 */
  --secondary: 0 0% 95%;           /* 次要背景 - 极浅灰 #F2F2F2 */
  --secondary-foreground: 0 0% 0%;  /* 次要前景 - 纯黑 */

  /* 柔和元素 */
  --muted: 0 0% 90%;               /* 柔和背景 - 浅灰 #E6E6E6 */
  --muted-foreground: 0 0% 40%;    /* 柔和前景 - 深灰 #666666 */

  /* 强调元素 */
  --accent: 0 0% 90%;              /* 强调背景 - 浅灰 */
  --accent-foreground: 0 0% 0%;    /* 强调前景 - 纯黑 */

  /* 边框与输入 */
  --border: 0 0% 80%;              /* 边框颜色 - 中灰 #CCCCCC */
  --input: 0 0% 80%;               /* 输入框边框 */
  --ring: 0 0% 0%;                 /* 焦点环 - 纯黑 */

  /* 圆角统一为零 */
  --radius: 0rem;
}
```

#### Tailwind 扩展色彩 (`tailwind.config.js`)

```javascript
colors: {
  // ===== 品牌色彩 =====
  'brand-black': '#000000',        // 纯黑 - 主要文本和边框
  'brand-linen': '#ffffff',        // 亚麻白（纯白）- 背景
  'brand-pure-black': '#000000',   // 纯黑（别名）
  'brand-text': '#000000',         // 文本黑
  'brand-light-gray': '#999999',   // 浅灰 - 装饰性文本
  'brand-dark-gray': '#333333',    // 深灰 - 次要文本
  'brand-border': '#000000',       // 边框黑

  // ===== E-ink 专用色彩 =====
  'ink-black': '#000000',          // 墨黑 - 最重要
  'ink-dark': '#333333',           // 深墨色 - 次要文本
  'ink-medium': '#666666',         // 中墨色 - 辅助文本
  'ink-light': '#999999',          // 浅墨色 - 装饰
  'ink-pale': '#cccccc',           // 极浅墨色 - 边框
  'ink-white': '#ffffff',          // 墨白 - 背景
  'ink-paper': '#fafafa',          // 墨纸色 - 柔和背景
}
```

### 1.2 色彩使用规则

#### 主要配色方案

| 用途 | 颜色 | Hex值 | Tailwind类 |
|------|------|-------|-----------|
| 主背景 | 纯白 | #FFFFFF | `bg-white` / `bg-brand-linen` |
| 主文本 | 纯黑 | #000000 | `text-black` / `text-brand-text` |
| 次要文本 | 深灰 | #333333 | `text-brand-dark-gray` |
| 装饰文本 | 浅灰 | #999999 | `text-brand-light-gray` |
| 边框 | 纯黑 | #000000 | `border-brand-border` |
| 禁用状态 | 中灰 | #666666 | `text-ink-medium` |
| 悬停状态 | 纯黑 | #000000 | `hover:text-brand-text` |

#### 透明度规范

```css
/* 渐变蒙版透明度 */
from-brand-linen/20    /* 20% 不透明度 - 柔和渐变 */
from-brand-pure-black/40  /* 40% 不透明度 - 中等渐变 */
from-transparent       /* 完全透明起点 */

/* 边框透明度 */
border-brand-border/30  /* 30% 黑色 - 毛玻璃边框 */
border-brand-text/50    /* 50% 黑色 - 装饰线 */
```

#### 状态色彩

```css
/* 禁用状态 */
opacity-30              /* 30% 不透明度 */
cursor-not-allowed      /* 禁用光标 */

/* 悬停状态 */
hover:opacity-80        /* 80% 不透明度 */
hover:scale-105         /* 105% 放大 */

/* 激活状态 */
active:scale-95         /* 95% 缩小 */
```

### 1.3 特殊色彩效果

#### 纸张纹理背景

```css
/* 微妙的点状纹理，模拟纸张质感 */
background-image:
  radial-gradient(circle at 25% 25%, rgba(0,0,0,0.02) 1px, transparent 1px),
  radial-gradient(circle at 75% 75%, rgba(0,0,0,0.02) 1px, transparent 1px);
background-size: 4px 4px;
```

#### 灰度图片效果

```css
/* E-ink 风格灰度图片 */
filter: grayscale(100%) contrast(1.2);

/* 悬停时保持灰度但放大 */
transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
hover:transform: scale(1.05);
```

---

## 二、排版系统

### 2.1 字体家族

#### 字体配置

```javascript
fontFamily: {
  // Oswald - 标题字体（装饰性、几何感）
  oswald: ['Oswald', 'sans-serif'],

  // Roboto - 正文字体（易读性优先）
  roboto: ['Roboto', 'sans-serif'],

  // Courier New - 等宽字体（代码、技术感）
  mono: ['Courier New', 'monospace'],
}
```

#### 字体使用规范

| 字体 | 用途 | 字重 | 示例 |
|------|------|------|------|
| **Oswald** | 所有标题 (H1-H6) | 700 (Bold) | 探索技术的<br>无限可能 |
| **Roboto** | 正文、描述 | 400 (Regular) | TechInk 是一个专注于技术交流的社区... |
| **Courier New** | 代码、标签 | 400 | `const config = {}` |

### 2.2 字号层级

#### 完整字号系统

```css
/* ===== 超大标题 ===== */
text-7xl      /* 5.625rem = 90px  - Hero主标题 */
text-6xl      /* 4.5rem = 72px   - 章节标题 */
text-5xl      /* 3rem = 48px     - 副标题 */

/* ===== 大标题 ===== */
text-4xl      /* 2.25rem = 36px  - 卡片标题 */
text-3xl      /* 1.875rem = 30px - 搜索框 */
text-2xl      /* 1.5rem = 24px  - 小标题 */

/* ===== 正文 ===== */
text-xl       /* 1.25rem = 20px  - 大正文 */
text-base     /* 1rem = 16px    - 标准正文 */
text-lg       /* 1.125rem = 18px - 引导文本 */

/* ===== 小字 ===== */
text-sm       /* 0.875rem = 14px - 辅助文本 */
text-xs       /* 0.75rem = 12px  - 标签/分类 */
```

#### 响应式字号示例

```css
/* Hero 主标题响应式 */
text-4xl          /* 移动端: 36px */
  sm:text-5xl     /* 平板: 48px */
  lg:text-6xl     /* 桌面: 60px */
  xl:text-7xl     /* 大屏: 90px */

/* 章节标题响应式 */
text-4xl          /* 移动端: 36px */
  lg:text-5xl     /* 桌面: 60px */
  xl:text-6xl     /* 大屏: 72px */
```

### 2.3 字重与样式

#### 字重规范

```css
/* ===== 标题字重 ===== */
font-light          /* 300 - Oswald Light (主标题) */
font-normal         /* 400 - Oswald Regular */
font-medium         /* 500 - Oswald Medium (强调) */
font-bold           /* 700 - Oswald Bold (小标题) */

/* ===== 正文字重 ===== */
font-roboto         /* 400 - Roboto Regular */
```

#### 字间距（Letter Spacing）

```css
/* ===== 负字距（紧凑感）===== */
tracking-tighter   /* -0.05em - 极紧凑 */
tracking-tight     /* -0.025em - 紧凑 */
/* 标题默认: letter-spacing: -0.02em */

/* ===== 正常字距 ===== */
tracking-normal    /* 0em - 默认 */

/* ===== 宽字距（装饰性）===== */
tracking-wide      /* 0.025em - 略宽 */
tracking-wider     /* 0.05em - 宽 */
tracking-widest    /* 0.1em - 极宽（标签、日期） */

/* ===== 自定义字距 ===== */
tracking-[0.05em]  /* 自定义值 */
```

#### 实际应用

```css
/* 章节标题 */
h2 {
  @apply font-oswald font-light text-4xl lg:text-5xl xl:text-6xl;
  letter-spacing: -0.02em;  /* 负字距，更紧凑 */
}

/* 分类标签 */
.category-tag {
  @apply font-roboto text-xs uppercase tracking-widest;
  /* 全大写 + 极宽字距 */
}

/* 日期显示 */
.date-display {
  @apply font-roboto text-xs tracking-widest;
  /* 装饰性宽字距 */
}
```

### 2.4 行高系统

```css
/* ===== 紧凑行高 ===== */
leading-none       /* 1 - 极紧凑（标题） */
leading-tight      /* 1.25 - 紧凑 */
leading-snug       /* 1.375 - 适中 */

/* ===== 标准行高 ===== */
leading-normal     /* 1.5 - 默认 */

/* ===== 宽松行高 ===== */
leading-relaxed    /* 1.625 - 宽松（正文阅读） */
leading-loose      /* 2 - 极松 */
```

#### 使用规范

| 元素 | 行高 | 示例 |
|------|------|------|
| Hero 标题 | `leading-[1.15]` | 极紧凑，增强视觉冲击力 |
| 章节标题 | `leading-tight` | 1.25，保持紧凑 |
| 正文段落 | `leading-relaxed` | 1.625，舒适阅读 |

### 2.5 文本样式模式

#### 垂直文本（日期显示）

```css
/* 垂直排列的日期 */
.writing-mode-vertical {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

/* 实际使用 */
<div className="font-roboto text-xs tracking-widest text-brand-dark-gray">
  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
    2026年2月26日
  </span>
</div>
```

#### 全大写文本

```css
/* 分类标签 */
<span className="text-xs uppercase tracking-wider">
  前端开发
</span>

/* 按钮 */
<button className="uppercase tracking-wider">
  开始探索
</button>
```

#### 文本选择样式

```css
/* 选中文本的反色效果 */
::selection {
  background-color: #000;  /* 黑色背景 */
  color: #fff;             /* 白色文字 */
}
```

---

## 三、间距与布局系统

### 3.1 容器系统

#### 最大宽度容器

```css
/* ===== 主容器 ===== */
max-w-[1600px]            /* 自定义最大宽度 */
mx-auto                   /* 水平居中 */
px-6 lg:px-12            /* 响应式内边距 */

/* ===== 内容容器 ===== */
max-w-7xl                 /* 1280px - 标准内容宽度 */
max-w-4xl                 /* 896px - 文章宽度 */
max-w-2xl                 /* 672px - 窄内容 */
```

#### Section 标准结构

```css
/* 标准章节容器 */
<section className="relative py-20 lg:py-32">
  <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
    {/* 内容 */}
  </div>
</section>

/* 紧凑章节 */
<section className="py-12 lg:py-20">

/* 宽松章节 */
<section className="py-24 lg:py-40">
```

### 3.2 间距系统（8px 网格）

所有间距基于 **8px** 的倍数：

```css
/* ===== 间距倍数表 ===== */
4px    = 0.25rem = p-1, m-1, gap-1
8px    = 0.5rem  = p-2, m-2, gap-2
12px   = 0.75rem = p-3, m-3, gap-3
16px   = 1rem    = p-4, m-4, gap-4
24px   = 1.5rem  = p-6, m-6, gap-6
32px   = 2rem    = p-8, m-8, gap-8
48px   = 3rem    = p-12, m-12, gap-12
64px   = 4rem    = p-16, m-16, gap-16
96px   = 6rem    = p-24, gap-24
128px  = 8rem    = p-32
```

### 3.3 组件间距规范

```css
/* ===== 章节间距 ===== */
mb-12 lg:mb-16         /* 标题与内容的间距 */
mb-8 lg:mb-12          /* 组件组之间 */

/* ===== 元素间距 ===== */
mb-2                   /* 小间距 - 标签与标题 */
mb-4                   /* 中小间距 - 段落间距 */
mb-6                   /* 中等间距 - 卡片内 */
mb-8                   /* 大间距 - 独立内容块 */

/* ===== 特殊间距 ===== */
gap-4 lg:gap-8         /* 响应式网格间距 */
gap-6 lg:gap-12        /* 卡片之间的间距 */
```

### 3.4 网格布局系统

#### 标准网格

```css
/* ===== 两列布局 ===== */
grid grid-cols-1 lg:grid-cols-2
gap-8 lg:gap-16

/* ===== 三列布局 ===== */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6 lg:gap-8

/* ===== 复杂网格（12列系统）===== */
grid grid-cols-1 lg:grid-cols-12
gap-8

/* 侧边栏 + 主内容 */
lg:col-span-3          /* 侧边栏占3列 */
lg:col-span-9          /* 主内容占9列 */

/* ===== 响应式网格 ===== */
grid-cols-1            /* 移动: 1列 */
md:grid-cols-2         /* 平板: 2列 */
lg:grid-cols-3         /* 桌面: 3列 */
xl:grid-cols-4         /* 大屏: 4列 */
```

#### 特殊布局模式

```css
/* ===== 水平滚动布局 ===== */
.flex {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;  /* 隐藏滚动条 */
}

.gap-6 lg:gap-12        /* 元素间距 */

/* ===== 固定侧边栏布局 ===== */
.lg:sticky lg:top-32 h-fit
/* 桌面端粘性定位，距离顶部128px */

/* ===== 分屏布局 ===== */
.grid lg:grid-cols-2 gap-8 lg:gap-16 items-center
/* Hero区域使用 */
```

### 3.5 响应式断点

```css
/* ===== Tailwind 断点 ===== */
sm:    /* 640px - 手机横屏 */
md:    /* 768px - 平板竖屏 */
lg:    /* 1024px - 平板横屏/小笔记本 */
xl:    /* 1280px - 桌面 */
2xl:   /* 1536px - 大屏 */

/* ===== 移动优先策略 ===== */
/* 先写移动端样式，后加断点增强 */

className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl"
/* 36px → 48px → 60px → 90px */
```

---

## 四、视觉效果系统

### 4.1 边框系统

#### 基础边框

```css
/* ===== 边框宽度 ===== */
border            /* 1px 默认边框 */
border-2          /* 2px 粗边框 */
border-b          /* 底部边框 */
border-t          /* 顶部边框 */

/* ===== 边框颜色 ===== */
border-brand-border     /* 纯黑边框 */
border-brand-text/30    /* 30%透明度黑边框 */
border-brand-dark-gray  /* 深灰边框 */
```

#### 像素边框效果

```css
/* ===== 像素风格边框 ===== */
.pixel-border {
  border: 2px solid #000;
  box-shadow: 4px 4px 0 0 #000;
  transition: all 0.2s ease-out;
}

.pixel-border:hover {
  box-shadow: 2px 2px 0 0 #000;
  transform: translate(2px, 2px);
}

/* Tailwind 类组合 */
border-2 border-brand-border
shadow-[4px_4px_0_0_#000]
hover:shadow-[2px_2px_0_0_#000]
hover:translate-x-0.5 hover:translate-y-0.5
```

### 4.2 阴影系统

#### 阴影定义

```javascript
boxShadow: {
  // Tailwind 默认
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",

  // 自定义像素阴影
  'pixel': '4px 4px 0 0 #000',           /* 标准像素阴影 */
  'pixel-sm': '2px 2px 0 0 #000',        /* 小像素阴影 */
  'pixel-hover': '2px 2px 0 0 #000',     /* 悬停像素阴影 */
}
```

#### 使用规范

```css
/* ===== 卡片阴影 ===== */
shadow-xl              /* 大阴影 - 卡片悬停 */
shadow-md              /* 中等阴影 - 按钮 */

/* ===== 按钮阴影 ===== */
shadow-[4px_4px_0_0_#000]
hover:shadow-[2px_2px_0_0_#000]

/* ===== 投影效果 ===== */
drop-shadow(-4px 0 8px rgba(0,0,0,0.3))  /* 左侧投影 */
drop-shadow(4px 0 8px rgba(0,0,0,0.3))   /* 右侧投影 */
```

### 4.3 毛玻璃效果

#### 玻璃态定义

```css
/* ===== 基础玻璃效果 ===== */
.glass {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* ===== 增强型玻璃效果 ===== */
.glass-enhanced {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}
```

#### 使用示例

```css
/* 导航栏毛玻璃 */
<nav className="glass border-b border-brand-border/30">

/* 卡片毛玻璃 */
<div className="glass p-6 lg:p-8 backdrop-blur-xl">

/* 覆盖层毛玻璃 */
<div className="bg-brand-linen/80 backdrop-blur-sm">
```

### 4.4 噪点纹理

#### SVG 噪点叠加

```css
/* ===== 噪点叠加层 ===== */
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

/* ===== 噪点动画 ===== */
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
```

### 4.5 渐变效果

#### 常用渐变模式

```css
/* ===== 顶部渐变蒙版 ===== */
bg-gradient-to-t from-brand-linen/20 to-transparent

/* ===== 底部渐变蒙版 ===== */
bg-gradient-to-t from-brand-pure-black/40 to-transparent

/* ===== 水平渐变 ===== */
bg-gradient-to-r from-brand-linen/50 to-transparent mix-blend-overlay

/* ===== 图片悬停渐变 ===== */
bg-gradient-to-r from-transparent via-white/10 to-transparent
```

### 4.6 圆角系统

#### 零圆角设计

```javascript
borderRadius: {
  xl: "0",
  lg: "0",
  md: "0",
  sm: "0",
  xs: "0",
}
```

**所有圆角都被设置为 0**，保持 E-ink 的尖锐、几何感。

```css
/* ===== 按钮圆角 ===== */
/* 无圆角，纯几何感 */
<button className="rounded-none">

/* ===== 输入框圆角 ===== */
<input className="rounded-none">

/* ===== 卡片圆角 ===== */
<div className="rounded-none">
```

---

## 五、动画系统

### 5.1 缓动函数

#### 核心缓动集合

```javascript
export const EASING = {
  // ===== 主要缓动 =====
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  // 用途: 大多数过渡效果，自然减速

  // ===== 对称缓动 =====
  smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
  // 用途: 双向动画，对称进出

  // ===== 戏剧性缓动 =====
  dramatic: 'cubic-bezier(0.85, 0, 0.15, 1)',
  // 用途: 需要视觉冲击的转场

  // ===== Power 缓动 =====
  power3Out: 'power3.out',  // 强烈结束
  power4Out: 'power4.out',  // 非常强烈结束
  power2Out: 'power2.out',  // 适度结束

  // ===== 弹性缓动 =====
  elastic: 'elastic.out(1, 0.5)',
  // 用途: 恢复动画、点击反馈
} as const;
```

#### Tailwind 类映射

```css
/* ===== 自定义缓动类 ===== */
.ease-expo-out     /* cubic-bezier(0.16, 1, 0.3, 1) */
.ease-smooth       /* cubic-bezier(0.65, 0, 0.35, 1) */
.ease-dramatic     /* cubic-bezier(0.85, 0, 0.15, 1) */
```

### 5.2 持续时间预设

```javascript
export const DURATION = {
  fast: 0.2,      /* 极快 - 200ms - 微交互 */
  normal: 0.4,    /* 快速 - 400ms - 标准过渡 */
  medium: 0.6,    /* 中等 - 600ms - 内容展示 */
  slow: 0.8,      /* 慢速 - 800ms - 大型元素 */
  verySlow: 1.2,  /* 极慢 - 1200ms - 戏剧性效果 */
} as const;
```

#### 使用指南

| 场景 | 持续时间 | 缓动函数 |
|------|----------|----------|
| 按钮悬停 | 200ms | `ease-out` |
| 颜色过渡 | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 卡片进入 | 600ms | `power3.out` |
| 标题揭示 | 800ms | `expo.out` |
| 大型转场 | 1200ms | `dramatic` |

### 5.3 错开延迟

```javascript
export const STAGGER = {
  fast: 0.05,    /* 50ms - 小元素快速序列 */
  normal: 0.1,   /* 100ms - 标准序列 */
  slow: 0.15,    /* 150ms - 大元素慢速序列 */
} as const;
```

#### GSAP Stagger 使用

```javascript
// 快速序列（列表项）
stagger: STAGGER.fast,  // 0.05s

// 标准序列（卡片）
stagger: STAGGER.normal,  // 0.1s

// 慢速序列（大型区块）
stagger: STAGGER.slow,  // 0.15s
```

### 5.4 动画配置常量

#### 完整配置文件

```javascript
// src/constants/animation.constants.ts

/** 光标动画配置 */
export const CURSOR_CONFIG = {
  dotSpeed: 0.2,        // 点的移动速度
  ringSpeed: 0.1,       // 环的移动速度（更慢，创建拖尾）
  hoverSize: 48,        // 悬停时的大小 (px)
  defaultSize: 32,      // 默认大小 (px)
  dotSize: 6,          // 点的大小 (px)
} as const;

/** 滚动动画配置 */
export const SCROLL_CONFIG = {
  refreshDelay: 200,           // 调整大小后的刷新延迟 (ms)
  parallaxIntensity: 0.5,      // 视差强度 (0-1)
  defaultStart: 'top 80%',     // 默认触发位置
  defaultEnd: 'bottom 20%',    // 默认结束位置
} as const;

/** 揭示动画配置 */
export const REVEAL_CONFIG = {
  startY: 30,              // 初始 Y 偏移 (px)
  duration: 0.8,           // 动画时长 (s)
  ease: 'power3.out',       // 缓动函数
  triggerStart: 'top 85%', // 触发位置
} as const;

/** Hero 区块动画配置 */
export const HERO_CONFIG = {
  unfoldDuration: 1.5,          // 3D 展开时长 (s)
  unfoldEase: 'expo.out',        // 展开缓动
  tiltIntensity: 5,              // 最大倾斜角度 (deg)
  tiltDuration: 0.5,             // 倾斜动画时长 (s)
  tiltEase: 'power2.out',        // 倾斜缓动
  parallaxDistance: -150,        // 视差距离 (px)
  titleDrift: 50,                // 标题漂移 (px)
} as const;

/** 磁性效果配置 */
export const MAGNETIC_CONFIG = {
  magnetRadius: 80,            // 磁力影响半径 (px)
  magnetStrength: 0.3,         // 磁力强度 (0-1)
  recoveryDuration: 0.5,       // 恢复动画时长 (s)
  recoveryEase: 'elastic.out(1, 0.5)', // 恢复缓动
} as const;
```

### 5.5 关键帧动画

#### 噪点动画

```css
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

/* 使用 */
.animate-grain  /* 8s steps(10) infinite */
```

#### 浮动动画

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 使用 */
.animate-float  /* 6s ease-in-out infinite */
```

#### E-ink 刷新动画

```css
@keyframes ink-refresh {
  0% { opacity: 1; }
  50% { opacity: 0.8; filter: invert(1); }
  100% { opacity: 1; }
}

/* 使用 */
.animate-ink-refresh  /* 0.3s ease-out */
```

#### 脉冲动画（微妙版）

```css
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* 使用 */
.animate-pulse-subtle  /* 4s ease-in-out infinite */
```

### 5.6 常用动画模式

#### 悬停效果

```css
/* ===== 缩放悬停 ===== */
hover:scale-105
transition-transform duration-500 ease-expo-out

/* ===== 颜色反转悬停 ===== */
bg-white text-black
hover:bg-black hover:text-white
transition-colors duration-300

/* ===== 位移悬停 ===== */
group-hover:translate-x-1
transform transition-transform duration-300

/* ===== 下划线展开 ===== */
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

#### 揭示动画

```css
/* ===== 基础揭示 ===== */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ===== 文字遮罩揭示 ===== */
.text-mask {
  background: linear-gradient(to right, #000, #000);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### 图片悬停效果

```css
/* ===== E-ink 风格图片悬停 ===== */
.img-hover-zoom {
  overflow: hidden;
}

.img-hover-zoom img {
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  filter: grayscale(100%) contrast(1.2);
}

.img-hover-zoom:hover img {
  transform: scale(1.05);
}
```

---

## 六、交互设计

### 6.1 自定义光标系统

#### 双层光标设计

```javascript
// 光标配置
const CURSOR_CONFIG = {
  dotSpeed: 0.2,        // 点的跟随速度（快）
  ringSpeed: 0.1,       // 环的跟随速度（慢，创建拖尾）
  hoverSize: 48,        // 悬停时环的大小
  defaultSize: 32,      // 默认环的大小
  dotSize: 6,          // 点的大小
};
```

#### 光标样式

```css
/* ===== 光标点 ===== */
.cursor-dot {
  position: fixed;
  width: 6px;
  height: 6px;
  background: #000;
  border-radius: 50%;
  pointer-events: none;
  z-index: 10000;
  transition: transform 0.08s ease-out,
              width 0.2s ease,
              height 0.2s ease;
}

/* ===== 光标环 ===== */
.cursor-ring {
  position: fixed;
  width: 28px;
  height: 28px;
  border: 1.5px solid #000;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.2s ease;
}

/* ===== 悬停状态 ===== */
.cursor-ring.hover {
  width: 44px;
  height: 44px;
  border-color: #000;
  background: rgba(0, 0, 0, 0.03);
}

/* ===== 点击状态 ===== */
.cursor-dot.active,
.cursor-ring.active {
  transform: scale(0.9);
}
```

#### 交互元素标记

```css
/* ===== 添加到所有交互元素 ===== */
.cursor-hover {
  /* 触发光标悬停效果 */
}

/* ===== 示例 ===== */
<a className="cursor-hover">链接</a>
<button className="cursor-hover">按钮</button>
```

### 6.2 磁性效果

#### 磁性配置

```javascript
const MAGNETIC_CONFIG = {
  magnetRadius: 80,          // 磁力影响半径 (px)
  magnetStrength: 0.3,       // 磁力强度 (0-1)
  recoveryDuration: 0.5,     // 恢复动画时长 (s)
  recoveryEase: 'elastic.out(1, 0.5)', // 弹性恢复
};
```

#### 使用方法

```css
/* ===== 添加磁性效果 ===== */
.magnetic {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== 应用到元素 ===== */
<button className="magnetic cursor-hover">
  按钮
</button>
```

### 6.3 平滑滚动

#### Lenis 配置

```javascript
const lenis = new Lenis({
  duration: 1.2,           // 滚动持续时间
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,       // 平滑滚轮
  wheelMultiplier: 1,      // 滚轮倍数
  touchMultiplier: 2,      // 触摸倍数
});
```

#### RAF 循环

```javascript
const raf = (time: number) => {
  lenis.raf(time);
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);
```

### 6.4 ScrollTrigger 配置

#### 默认设置

```javascript
// src/lib/gsap.ts
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.defaults({
  markers: false,  // 生产环境关闭调试标记
});

// 尊重减少动画偏好
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0);
}
```

#### 典型使用模式

```javascript
// ===== 滚动触发动画 =====
gsap.to(element, {
  y: 50,
  opacity: 0,
  duration: DURATION.medium,
  ease: EASING.expoOut,
  scrollTrigger: {
    trigger: element,
    start: 'top 85%',
    end: 'bottom 20%',
    toggleActions: 'play none none reverse',
  },
});

// ===== 视差效果 ===== */
gsap.to(element, {
  y: HERO_CONFIG.parallaxDistance,
  ease: 'none',
  scrollTrigger: {
    trigger: sectionRef.current,
    start: 'top top',
    end: 'bottom top',
    scrub: true,  // 绑定到滚动位置
  },
});
```

---

## 七、组件设计模式

### 7.1 按钮系统

#### 主要按钮样式

```css
/* ===== E-ink 实心按钮 ===== */
.btn-ink {
  @apply px-6 py-3;
  @apply bg-black text-white;
  @apply font-oswald uppercase tracking-wider;
  @apply border-2 border-black;
  transition: all 0.2s ease-out;
}

.btn-ink:hover {
  @apply bg-white text-black;
}

/* ===== E-ink 描边按钮 ===== */
.btn-ink-outline {
  @apply px-6 py-3;
  @apply bg-transparent text-black;
  @apply font-oswald uppercase tracking-wider;
  @apply border-2 border-black;
  transition: all 0.2s ease-out;
}

.btn-ink-outline:hover {
  @apply bg-black text-white;
}

/* ===== 三角形导航按钮 ===== */
.nav-triangle {
  width: 0;
  height: 0;
  border-top: 40px solid transparent;
  border-bottom: 40px solid transparent;
  /* 向右的三角形 */
  border-right: 50px solid #000000;
  filter: drop-shadow(4px 0 8px rgba(0,0,0,0.3));
  transition: all 0.3s ease-out;
}

.nav-triangle:hover {
  transform: scale(1.1);
}

.nav-triangle:disabled {
  border-right-color: #666666;
  filter: none;
  opacity: 0.3;
  cursor: not-allowed;
}
```

#### Apple 风格按钮

```css
/* ===== 半透明毛玻璃按钮 ===== */
.btn-apple {
  @apply px-6 py-3;
  @apply bg-white/90 backdrop-blur-sm;
  @apply border border-brand-text/20;
  @apply shadow-md;
  @apply rounded-full;  /* 如果需要圆角 */
  @apply transition-all duration-300;
}

.btn-apple:hover {
  @apply scale-105 shadow-xl;
  @apply bg-black text-white;
}

.btn-apple:disabled {
  @apply opacity-30 cursor-not-allowed;
}
```

### 7.2 卡片系统

#### 标准卡片结构

```css
/* ===== 基础卡片 ===== */
.article-card {
  @apply relative;
  @apply transition-all duration-500;
}

.article-card:hover {
  @apply scale-105 z-10;
}

/* ===== 卡片图片容器 ===== */
.card-image {
  @apply relative overflow-hidden;
  @apply bg-brand-text;
  @apply transition-all duration-500;
}

.card-image:hover {
  @apply scale-105;
}

/* ===== 图片悬停效果 ===== */
.card-image img {
  @apply transition-transform duration-700;
  @apply hover:scale-110;
  @apply grayscale contrast-125;
}

/* ===== 卡片内容 ===== */
.card-content {
  @apply relative z-10;
  @apply mt-4;
  @apply transition-all duration-500;
}

.article-card:hover .card-content {
  @apply -translate-y-2;
}

/* ===== 分类标签 ===== */
.card-category {
  @apply font-roboto;
  @apply text-xs;
  @apply uppercase tracking-wider;
  @apply text-brand-dark-gray;
}

/* ===== 卡片标题 ===== */
.card-title {
  @apply font-oswald;
  @apply font-light;
  @apply text-xl lg:text-2xl;
  @apply text-brand-text;
  @apply mt-1;
  @apply leading-tight;
}

/* ===== 卡片描述 ===== */
.card-description {
  @apply font-roboto;
  @apply text-sm;
  @apply text-brand-dark-gray;
  @apply mt-1;
}
```

### 7.3 输入框系统

```css
/* ===== E-ink 搜索框 ===== */
.search-input {
  @apply w-full;
  @apply bg-transparent;
  @apply border-b-2 border-brand-text;
  @apply py-4;
  @apply text-3xl lg:text-5xl;
  @apply font-oswald font-light;
  @apply placeholder:text-brand-light-gray;
  @apply focus:outline-none;
}

/* ===== 标准输入框 ===== */
.input-standard {
  @apply w-full;
  @apply bg-transparent;
  @apply border-b border-brand-border;
  @apply py-3;
  @apply text-base;
  @apply font-roboto;
  @apply placeholder:text-brand-light-gray;
  @apply focus:outline-none;
  @apply focus:border-b-2;
  @apply transition-colors duration-300;
}
```

### 7.4 导航系统

#### 固定导航栏

```css
/* ===== 导航栏基础样式 ===== */
nav {
  @apply fixed top-0 left-0 right-0;
  @apply z-50;
  @apply transition-all duration-700 ease-expo-out;
}

/* ===== 正常模式 ===== */
nav.mode-normal {
  @apply py-6;
}

/* ===== 滚动压缩模式 ===== */
nav.mode-scrolled {
  @apply py-3 glass border-b border-brand-border/30;
}

/* ===== Logo ===== */
.nav-logo {
  @apply font-oswald font-light tracking-widest;
  @apply transition-all duration-700 ease-expo-out;
  @apply text-brand-text hover:text-brand-dark-gray;
}

.mode-normal .nav-logo {
  @apply text-4xl lg:text-5xl;
}

.mode-scrolled .nav-logo {
  @apply text-2xl;
}

/* ===== 导航链接 ===== */
.nav-link {
  @apply font-roboto;
  @apply text-xs uppercase tracking-wider;
  @apply text-brand-dark-gray;
  @apply hover:text-brand-text;
  @apply transition-colors duration-300;
  @apply relative;
  @apply liquid-underline;  /* 下划线动画 */
}
```

---

## 八、Section 组件设计模式

### 8.1 Hero Section

#### 设计特点

```css
/* ===== 3D 透视容器 ===== */
.perspective-2000 {
  perspective: 2000px;
}

.preserve-3d {
  transform-style: preserve-3d;
}

/* ===== 垂直日期 ===== */
.vertical-date {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

/* ===== Hero 标题 ===== */
.hero-title {
  @apply font-oswald font-light;
  @apply text-4xl sm:text-5xl lg:text-6xl xl:text-7xl;
  @apply leading-[1.15];  /* 极紧凑行高 */
  @apply tracking-tight;
}

/* ===== 渐变蒙版 ===== */
.hero-gradient {
  @apply absolute inset-0;
  @apply bg-gradient-to-t from-brand-linen/20 to-transparent;
  @apply pointer-events-none;
}
```

#### 动画序列

```javascript
// Hero 入场动画序列
const entryTl = gsap.timeline({ delay: 0.5 });

// 1. 图片 3D 展开（1.5s）
entryTl.fromTo(
  imageContainer,
  { rotateX: 90, opacity: 0 },
  { rotateX: 0, opacity: 1, duration: 1.5, ease: 'expo.out' }
);

// 2. 标题遮罩揭示（1s，提前 1s 开始）
entryTl.fromTo(
  title,
  { y: '100%', opacity: 0 },
  { y: '0%', opacity: 1, duration: 1, ease: 'power4.out' },
  '-=1'
);

// 3. 内容模糊淡入（0.6s，提前 0.6s 开始）
entryTl.fromTo(
  content,
  { filter: 'blur(10px)', opacity: 0 },
  { filter: 'blur(0px)', opacity: 1, duration: 0.6 },
  '-=0.6'
);

// 4. 日期滑入（0.4s，提前 0.4s 开始）
entryTl.fromTo(
  date,
  { y: 30, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
  '-=0.4'
);
```

### 8.2 Latest Articles（水平滚动）

#### 关键特性

```css
/* ===== 水平滚动容器 ===== */
.horizontal-scroll-container {
  @apply relative;
  @apply mx-16 lg:mx-20;
  @apply overflow-hidden;
}

/* ===== 滚动轨道 ===== */
.scroll-track {
  @apply flex;
  @apply will-change-transform;
}

/* ===== 卡片包装 ===== */
.cards-wrapper {
  @apply flex;
  @apply gap-6 lg:gap-12;
  @apply px-1;
}

/* ===== 单个卡片 ===== */
.article-card {
  @apply relative;
  @apply flex-shrink-0;
  @apply transition-all duration-500;
}

.article-card:hover {
  @apply scale-105 z-10;
}

/* ===== 进度指示器 ===== */
.progress-dots {
  @apply flex;
  @apply items-center;
  @apply gap-2;
}

.progress-dot {
  @apply transition-all duration-300;
  @apply rounded-full;
  @apply bg-brand-text/30;
  @apply hover:bg-brand-text/50;
}

.progress-dot.active {
  @apply w-8 h-2;  /* 活跃状态变成横条 */
  @apply bg-brand-text;
}

/* ===== 进度条 ===== */
.progress-bar {
  @apply h-px;
  @apply bg-brand-border;
  @apply overflow-hidden;
}

.progress-fill {
  @apply h-full;
  @apply bg-brand-text;
  @apply transition-all duration-300 ease-out;
}
```

#### 响应式卡片宽度

```javascript
// 计算卡片宽度
const updateDimensions = () => {
  const width = window.innerWidth >= 1024 ? 400 :
                window.innerWidth >= 768 ? 320 : 280;
  const spacing = window.innerWidth >= 1024 ? 48 : 24;
  const viewCount = window.innerWidth >= 1024 ? 3 :
                   window.innerWidth >= 768 ? 2 : 1;

  setCardWidth(width);
  setGap(spacing);
  setCardsPerView(viewCount);
};
```

### 8.3 其他 Section 共同模式

#### 统一的 Section 结构

```typescript
// 所有 Section 组件的基础结构
const SectionComponent = () => {
  // 1. Refs
  const sectionRef = useRef<HTMLElement>(null);

  // 2. State
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  // 3. Hooks
  const prefersReducedMotion = useReduceMotion();
  const shouldRender = Boolean(config.xxx);

  // 4. 动画初始化
  useEffect(() => {
    if (!shouldRender || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // GSAP 动画配置
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldRender]);

  // 5. 条件渲染
  if (!shouldRender) return null;

  // 6. JSX
  return (
    <section ref={sectionRef} className="relative py-20 lg:py-32">
      {/* 内容 */}
    </section>
  );
};
```

---

## 九、响应式设计

### 9.1 断点系统

```css
/* ===== 移动优先策略 ===== */
/* 默认样式 → 移动端 (320px+) */
/* sm: → 手机横屏 (640px+) */
/* md: → 平板竖屏 (768px+) */
/* lg: → 平板横屏 (1024px+) */
/* xl: → 桌面 (1280px+) */
/* 2xl: → 大屏 (1536px+) */

/* ===== 示例 ===== */
className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl"
/* 36px → 48px → 60px → 90px */
```

### 9.2 常见响应式模式

```css
/* ===== 容器内边距 ===== */
px-6 lg:px-12
/* 移动: 24px, 桌面: 48px */

/* ===== 章节垂直间距 ===== */
py-20 lg:py-32
/* 移动: 80px, 桌面: 128px */

/* ===== 网格列数 ===== */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
/* 移动: 1列, 平板: 2列, 桌面: 3列 */

/* ===== 显示/隐藏 ===== */
xl:block              /* 仅大屏显示 */
hidden lg:block       /* 移动隐藏，桌面显示 */

/* ===== 字号响应式 ===== */
text-sm lg:text-base
/* 移动: 14px, 桌面: 16px */
```

### 9.3 图片响应式

```typescript
// OptimizedImage 组件
<OptimizedImage
  src={image}
  alt={description}
  width={800}          // 固定宽度防止 CLS
  height={600}         // 固定高度
  loading="lazy"       // 懒加载
  className="w-full h-auto object-cover"
/>
```

---

## 十、可访问性

### 10.1 动画偏好检测

```typescript
// 使用 useReduceMotion Hook
const prefersReducedMotion = useReduceMotion();

// 条件执行动画
if (!prefersReducedMotion) {
  // 执行动画
} else {
  // 提供静态替代方案
}
```

### 10.2 ARIA 标签

```html
<!-- 导航栏 -->
<nav role="navigation" aria-label="主导航">

<!-- 搜索按钮 -->
<button aria-label="搜索" title="搜索 (Cmd/Ctrl + K)">

<!-- 搜索对话框 -->
<div role="dialog" aria-modal="true" aria-label="搜索">

<!-- 进度条 -->
<div
  role="progressbar"
  aria-valuenow={currentIndex}
  aria-valuemin={0}
  aria-valuemax={maxIndex}
>

<!-- 隐藏的标签 -->
<label htmlFor="search-input" className="sr-only">
  搜索文章、话题...
</label>
```

### 10.3 键盘导航

```typescript
// 键盘事件处理
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // 导航箭头
    if (e.key === 'ArrowLeft') navigateLeft();
    if (e.key === 'ArrowRight') navigateRight();

    // 搜索快捷键
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }

    // 关闭对话框
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## 十一、性能优化

### 11.1 GSAP 优化

```typescript
// 使用 gsap.context 自动清理
const ctx = gsap.context(() => {
  // 所有动画
}, sectionRef);

// 清理
return () => ctx.revert();

// ScrollTrigger 自动清理
return () => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
};
```

### 11.2 CSS 优化

```css
/* ===== 硬件加速 ===== */
.will-change-transform {
  will-change: transform;
}

/* ===== 防止布局抖动 ===== */
img {
  width: 100%;
  height: auto;
  aspect-ratio: attr(width) / attr(height);
}
```

### 11.3 懒加载

```typescript
// 图片懒加载
<img
  src={image}
  alt={alt}
  loading="lazy"  // 浏览器原生懒加载
  width={width}
  height={height}
/>

// 组件懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

---

## 十二、快速参考

### 12.1 常用 Tailwind 类组合

```css
/* ===== 按钮 ===== */
btn-primary =
  "px-6 py-3 bg-black text-white font-oswald uppercase tracking-wider
   border-2 border-black transition-all duration-300 hover:bg-white hover:text-black"

/* ===== 导航链接 ===== */
nav-link =
  "font-roboto text-xs uppercase tracking-wider text-brand-dark-gray
   hover:text-brand-text transition-colors relative liquid-underline"

/* ===== 卡片 ===== */
card =
  "group cursor-hover relative transition-all duration-500
   hover:scale-105 hover:z-10"

/* ===== 标题 ===== */
section-title =
  "font-oswald font-light text-4xl lg:text-5xl xl:text-6xl
   text-brand-text leading-tight tracking-tight"

/* ===== 分类标签 ===== */
category-tag =
  "font-roboto text-xs uppercase tracking-wider text-brand-dark-gray"

/* ===== 描述文本 ===== */
description =
  "font-roboto text-base lg:text-lg text-brand-dark-gray
   leading-relaxed"
```

### 12.2 颜色速查表

| 用途 | 类名 | Hex值 |
|------|------|-------|
| 纯黑背景/文本 | `bg-brand-black` / `text-brand-black` | #000000 |
| 纯白背景 | `bg-white` / `bg-brand-linen` | #FFFFFF |
| 深灰文本 | `text-brand-dark-gray` | #333333 |
| 浅灰文本 | `text-brand-light-gray` | #999999 |
| 黑色边框 | `border-brand-border` | #000000 |

### 12.3 间距速查表

| 类名 | 值 | 用途 |
|------|-----|------|
| `p-4` | 16px | 小卡片内边距 |
| `p-6` | 24px | 标准卡片内边距 |
| `p-8` | 32px | 大卡片内边距 |
| `p-12` | 48px | Section 内边距（小） |
| `gap-4` | 16px | 网格/弹性间距（小） |
| `gap-8` | 32px | 网格/弹性间距（标准） |
| `gap-12` | 48px | 卡片之间间距 |

### 12.4 动画速查表

| 场景 | 持续时间 | 缓动函数 |
|------|----------|----------|
| 微交互 | 200ms | `ease-out` |
| 悬停过渡 | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 内容进入 | 600ms | `power3.out` |
| 大型动画 | 800ms | `expo.out` |
| 戏剧效果 | 1200ms | `dramatic` |

---

## 十三、设计检查清单

### 新组件开发时检查

- [ ] 使用正确的字体（Oswald 标题，Roboto 正文）
- [ ] 零圆角（`rounded-none` 或保持默认）
- [ ] 黑白灰配色，无其他颜色
- [ ] 响应式设计（移动优先）
- [ ] 动画使用正确的缓动函数（`expo-out`）
- [ ] 添加 `prefersReducedMotion` 检查
- [ ] 添加 ARIA 标签
- [ ] 支持键盘导航
- [ ] 使用 8px 网格间距
- [ ] 图片有 width/height 属性
- [ ] 悬停状态有视觉反馈
- [ ] 禁用状态有视觉反馈
- [ ] 过渡动画时间合理（200-800ms）

---

## 十四、开发资源

### 14.1 设计令牌 (Design Tokens)

项目中提供了完整的设计令牌文件 `src/types/design-tokens.ts`，集中管理所有设计常量。

#### 导入使用

```typescript
import {
  // 颜色
  BRAND_COLORS,
  INK_COLORS,
  OPACITY,
  GRAYSCALE_OPACITY,

  // 字体
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  LINE_HEIGHT,

  // 间距
  SPACING,
  COMPONENT_SPACING,
  CONTAINER_WIDTH,

  // 圆角
  BORDER_RADIUS,

  // 边框
  BORDER_WIDTH,
  BORDER_STYLE,

  // 阴影
  SHADOW,

  // 动画
  EASING,
  DURATION,
  STAGGER,
  TRANSITION,

  // 断点
  BREAKPOINT,
  MEDIA_QUERY,

  // Z-index
  Z_INDEX,

  // 特效
  IMAGE_EFFECT,
  GLASS_EFFECT,
  PIXEL_BORDER,

  // 组合类
  BUTTON_CLASSES,
  NAV_CLASSES,
  CARD_CLASSES,
  TITLE_CLASSES,
  INPUT_CLASSES,
} from '@/types/design-tokens';
```

#### 使用示例

```typescript
// 使用颜色令牌
const buttonStyle = {
  backgroundColor: BRAND_COLORS.black,
  color: BRAND_COLORS.linen,
};

// 使用间距令牌
const sectionStyle = {
  padding: SPACING['12'], // 48px
};

// 使用动画令牌
gsap.to(element, {
  duration: DURATION.medium,
  ease: EASING.expoOut,
});
```

---

### 14.2 组件模板

项目提供了完整的组件模板，位于 `src/templates/` 目录。

#### 可用模板

| 模板文件 | 用途 | 路径 |
|----------|------|------|
| **SectionTemplate.tsx** | Section 页面区块组件 | `src/templates/` |
| **CardTemplate.tsx** | 卡片组件 | `src/templates/` |
| **ButtonTemplate.tsx** | 按钮组件 | `src/templates/` |
| **useScrollAnimationTemplate.ts** | 滚动动画 Hook | `src/templates/` |

#### 使用模板的步骤

**创建新的 Section 组件**:

1. 复制 `src/templates/SectionTemplate.tsx`
2. 粘贴到 `src/sections/` 目录
3. 重命名为 `[YourSection]Section.tsx`
4. 替换所有 `[YourSection]` 为实际名称
5. 在 `src/config.ts` 中添加配置
6. 在 `src/App.tsx` 中引入使用

**创建新的卡片组件**:

1. 复制 `src/templates/CardTemplate.tsx`
2. 粘贴到 `src/components/` 目录
3. 根据需求调整 props
4. 直接导入使用

**创建新的按钮变体**:

1. 查看 `ButtonTemplate.tsx`
2. 在 `variant` prop 中添加新变体
3. 或直接使用组件的 `className` prop 自定义

---

### 14.3 快速开始

#### 场景 1：创建新的 Section 组件

```bash
# 1. 复制模板
cp src/templates/SectionTemplate.tsx src/sections/NewsSection.tsx

# 2. 编辑文件，替换 [YourSection] 为 News
# 3. 在 src/config.ts 添加配置
# 4. 在 src/App.tsx 中引入
```

#### 场景 2：使用设计令牌

```typescript
// 在你的组件中
import { BRAND_COLORS, FONT_SIZE, EASING, DURATION } from '@/types/design-tokens';

function MyComponent() {
  return (
    <div style={{ color: BRAND_COLORS.black }}>
      <h1 style={{ fontSize: FONT_SIZE['4xl'] }}>标题</h1>
    </div>
  );
}
```

#### 场景 3：使用预设动画 Hook

```typescript
import { useFadeInUp, useScaleIn, useSlideIn } from '@/hooks/useScrollAnimation';

function MySection() {
  const { ref: fadeRef } = useFadeInUp();
  const { ref: slideRef } = useSlideIn('left');

  return (
    <div>
      <div ref={fadeRef}>我会淡入上升</div>
      <div ref={slideRef}>我会从左滑入</div>
    </div>
  );
}
```

---

### 14.4 模板文档

详细的模板使用指南请参阅：
- **README_TEMPLATES.md** - 完整的模板使用文档

---

## 十五、文件结构

```
E:\KIMI_web\
├── ARTSTYLE.md              # 本文档 - 完整设计指南
├── README_TEMPLATES.md      # 模板使用指南
│
├── app\
│   ├── src\
│   │   ├── types\
│   │   │   └── design-tokens.ts       # 设计令牌文件
│   │   │
│   │   ├── templates\                 # 组件模板目录
│   │   │   ├── SectionTemplate.tsx    # Section 组件模板
│   │   │   ├── CardTemplate.tsx       # 卡片组件模板
│   │   │   ├── ButtonTemplate.tsx     # 按钮组件模板
│   │   │   └── useScrollAnimationTemplate.ts  # 动画 Hook 模板
│   │   │
│   │   ├── components\
│   │   │   ├── CustomCursor.tsx
│   │   │   ├── NoiseOverlay.tsx
│   │   │   ├── OptimizedImage.tsx
│   │   │   └── ui\                    # shadcn/ui 组件
│   │   │
│   │   ├── hooks\
│   │   │   ├── useReduceMotion.ts
│   │   │   ├── useScrollAnimation.ts
│   │   │   ├── useCustomCursor.ts
│   │   │   └── useLenis.ts
│   │   │
│   │   ├── constants\
│   │   │   └── animation.constants.ts  # 动画常量
│   │   │
│   │   ├── sections\                  # 页面区块组件
│   │   │   ├── HeroSection.tsx
│   │   │   ├── LatestArticles.tsx
│   │   │   └── ...
│   │   │
│   │   ├── config.ts                  # 站点配置
│   │   ├── index.css                  # 全局样式
│   │   └── App.tsx
│   │
│   ├── tailwind.config.js             # Tailwind 配置
│   └── vite.config.ts                 # Vite 配置
│
└── CLAUDE.md              # 项目改进记录
```

---

## 结语

这份设计指南记录了 TechInk Web 项目的完整美术风格系统。在开发新功能或修改现有组件时，请始终参考本指南以确保设计的一致性。

**核心理念**: 一切为了"墨水在纸上流动"的优雅体验。

### 相关文档

- **ARTSTYLE.md** (本文档) - 完整设计指南
- **README_TEMPLATES.md** - 组件模板使用指南
- **CLAUDE.md** - 项目改进记录

### 快速链接

- 设计令牌: `src/types/design-tokens.ts`
- 组件模板: `src/templates/`
- 动画常量: `src/constants/animation.constants.ts`
- Tailwind 配置: `tailwind.config.js`

---

*文档版本: 1.1.0*
*最后更新: 2026-03-03*
*维护者: TechInk Design Team*

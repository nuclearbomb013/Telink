---
name: visual-design-analyzer
description: 分析网站的视觉设计系统，提取配色方案、排版系统、组件风格、动画效果等美术效果信息。使用此技能获取网站的设计语言和视觉规范。
---

# Visual Design Analyzer - 视觉设计分析器

用于深度分析网站的视觉设计系统，提取完整的美术效果和设计规范。

## 使用场景

- 需要理解现有网站的设计风格时
- 需要为新页面/组件保持设计一致性时
- 需要提取设计系统的配色、排版、组件规范时
- 需要分析竞争对手或参考网站的设计时

## 快速开始

### 基础分析

```bash
/visual-design-analyzer analyze <URL>
```

### 专项分析

```bash
# 配色方案分析
/visual-design-analyzer colors <URL>

# 排版系统分析
/visual-design-analyzer typography <URL>

# 组件风格分析
/visual-design-analyzer components <URL>

# 动画效果分析
/visual-design-analyzer animations <URL>

# 布局结构分析
/visual-design-analyzer layout <URL>
```

## 分析维度

### 1. 配色系统 (Color System)

分析内容：
- 主色调 (Primary Colors)
- 辅助色 (Secondary Colors)
- 中性色 (Neutrals)
- 功能色 (Functional Colors - success, warning, error)
- 渐变方案 (Gradients)
- 色彩对比度 (Contrast Ratios)

输出格式：
```css
/* 配色方案 */
--primary: #000000;      /* 主黑色 */
--secondary: #333333;    /* 深灰色 */
--accent: #666666;       /* 强调灰 */
--background: #FFFFFF;   /* 背景白 */
--surface: #FAFAFA;      /* 表面浅灰 */
--border: #E0E0E0;       /* 边框 */
```

### 2. 排版系统 (Typography)

分析内容：
- 字体栈 (Font Stack)
- 字号层级 (Type Scale)
- 字重方案 (Font Weights)
- 行高比例 (Line Heights)
- 字母间距 (Letter Spacings)

输出格式：
```css
/* 字体系统 */
--font-heading: 'Oswald', sans-serif;
--font-body: 'Roboto', serif;
--font-mono: 'Fira Code', monospace;

/* 字号层级 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### 3. 组件风格 (Component Styles)

分析内容：
- 按钮样式 (Buttons)
- 卡片样式 (Cards)
- 输入框样式 (Inputs)
- 导航样式 (Navigation)
- 图标风格 (Icons)

输出格式：
```css
/* 按钮样式 */
.btn-primary {
  background: #000;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #333;
  transform: translateY(-1px);
}
```

### 4. 动画效果 (Animations)

分析内容：
- 缓动函数 (Easing Functions)
- 持续时间 (Durations)
- 过渡效果 (Transitions)
- 关键帧动画 (Keyframes)
- 滚动动画 (Scroll Animations)

输出格式：
```css
/* 缓动函数 */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* 持续时间 */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* 过渡效果 */
transition: all var(--duration-normal) var(--ease-smooth);
```

### 5. 布局系统 (Layout System)

分析内容：
- 栅格系统 (Grid System)
- 间距方案 (Spacing Scale)
- 断点设置 (Breakpoints)
- 容器宽度 (Container Widths)
- Z-index 层级 (Z-index Scale)

输出格式：
```css
/* 间距系统 */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */

/* 断点 */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

## 输出模板

### 设计系统摘要

```markdown
## [网站名称] 设计系统分析

### 设计风格概述
[2-3 句描述整体设计风格]

### 配色方案
| 角色 | 色值 | 用途 |
|------|------|------|
| Primary | #000000 | 主文本、按钮背景 |
| ... | ... | ... |

### 排版系统
- 标题字体：[字体名]
- 正文字体：[字体名]
- 字号范围：12px - 48px

### 核心组件
- 按钮：[风格描述]
- 卡片：[风格描述]
- 输入框：[风格描述]

### 动画特点
- 缓动类型：[描述]
- 典型时长：[描述]

### 设计原则
1. [原则 1]
2. [原则 2]
3. [原则 3]
```

## 技术实现

### 分析方法

1. **视觉扫描** - 通过截图分析主要视觉元素
2. **代码分析** - 检查 CSS/Tailwind 配置
3. **DOM 检查** - 分析实际渲染的计算样式
4. **交互测试** - 测试悬停、点击等状态变化

### 工具使用

```bash
# 使用浏览器开发者工具
# 1. 检查元素获取计算样式
# 2. 查看网络请求获取字体资源
# 3. 分析 CSS 变量定义

# 使用截图分析
# 1. 捕获完整页面截图
# 2. 提取主要颜色
# 3. 识别字体和间距
```

## 示例输出

### TechInk Web 设计系统

```markdown
## TechInk - E-ink 墨水屏风格设计系统

### 设计风格
极简主义黑白风格，模拟电子墨水屏的视觉效果，强调纸质阅读体验。

### 配色方案
| 变量 | 色值 | HSL | 用途 |
|------|------|-----|------|
| --ink-black | #000000 | 0° 0% 0% | 主文本、图标 |
| --ink-dark-gray | #333333 | 0° 0% 20% | 次级文本 |
| --ink-medium-gray | #666666 | 0° 0% 40% | 说明文字 |
| --ink-light-gray | #999999 | 0° 0% 60% | 占位符 |
| --ink-pale-gray | #CCCCCC | 0° 0% 80% | 边框 |
| --ink-white | #FFFFFF | 0° 0% 100% | 背景 |
| --ink-paper | #FAFAFA | 0° 0% 98% | 纸色背景 |

### 排版系统
```css
--font-heading: 'Oswald', sans-serif;  /* 粗体、紧凑 */
--font-body: 'Roboto', serif;          /* 易读、传统 */

--text-xs: 0.75rem;   /* 辅助文字 */
--text-sm: 0.875rem;  /* 次要信息 */
--text-base: 1rem;    /* 正文 */
--text-lg: 1.125rem;  /* 小标题 */
--text-xl: 1.25rem;   /* 卡片标题 */
--text-2xl: 1.5rem;   /* Section 标题 */
--text-3xl: 1.875rem; /* 页面标题 */
--text-4xl: 2.25rem;  /* Hero 标题 */
```

### 核心组件风格

**按钮**
- 背景：纯黑 (#000)
- 文字：白色
- 圆角：0.5rem (中等)
- 内边距：0.75rem 1.5rem
- 悬停：深灰 (#333) + 轻微上移
- 过渡：all 0.2s ease

**卡片**
- 背景：白色/浅灰
- 边框：1px solid #E0E0E0
- 圆角：0.75rem
- 阴影：柔和、低透明度
- 悬停：轻微缩放 + 阴影加深

**输入框**
- 背景：白色半透明
- 边框：1px solid #CCCCCC
- 圆角：0.5rem
- 焦点：2px ring + 边框变黑
- 特效：backdrop-blur

### 动画系统

**缓动函数**
```css
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);  /* Expo out */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

**持续时间**
- 快速反馈：150ms
- 标准过渡：300ms
- 慢速动画：500-800ms

**典型动画**
- 按钮悬停：transform + background 200ms
- 卡片揭示：opacity + translateY 600ms
- 页面过渡：fade 300ms

### 特殊效果

**噪声纹理**
```css
.noise-overlay {
  background: url("data:image/svg+xml,...");
  opacity: 0.04;
  mix-blend-mode: multiply;
}
```

**自定义光标**
- 内点：6px 黑色圆点
- 外环：28px 圆环，悬停扩展至 44px
- 过渡：0.25s cubic-bezier(0.16, 1, 0.3, 1)

**磁性效果**
- 吸引范围：100px
- 过渡：transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)

### 设计原则

1. **极简单色** - 仅使用黑白灰色调
2. **纸质质感** - 模拟真实纸张的视觉感受
3. **平滑过渡** - 所有交互都有流畅动画
4. **精致细节** - 微妙的阴影和边框变化
5. **功能优先** - 形式服务于内容和可读性
```

## 注意事项

1. **截图限制** - 某些区域可能需要滚动才能完整捕获
2. **动态内容** - 动画状态可能需要特殊捕捉
3. **暗色模式** - 需要分别分析亮色/暗色主题
4. **响应式设计** - 需要分析多个断点的表现

## 相关技能

- `/ui-ux-pro-max` - UI/UX 设计建议和最佳实践
- `/pydantic-models` - 数据结构定义（如需将设计系统导出为代码）

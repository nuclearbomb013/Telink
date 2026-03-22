# Visual Design Analysis Workflow

## 网站视觉设计分析工作流

### 步骤 1: 页面截图捕获

使用浏览器或工具捕获目标页面的完整截图。

**方法 A - 使用浏览器开发者工具:**
```
1. 打开目标网站
2. 按 F12 打开开发者工具
3. 按 Ctrl+Shift+P (Windows) 或 Cmd+Shift+P (Mac)
4. 输入 "screenshot" 并选择 "Capture full size screenshot"
5. 保存截图
```

**方法 B - 使用在线工具:**
- https://screenshot.guru/
- https://www.screentogif.com/
- https://firefox.com/inspector/

### 步骤 2: 上传截图进行分析

将截图上传给 Claude，然后使用以下提示词:

```
请分析这张网站截图的视觉设计，提取以下信息:

1. 配色方案 - 列出所有使用的主要颜色 (HEX 值)
2. 字体系统 - 识别使用的字体和字号层级
3. 组件风格 - 描述按钮、卡片、输入框等组件的设计特点
4. 间距系统 - 分析使用的间距和内边距模式
5. 动画效果 - 描述任何可见的动画或过渡效果

请以设计系统文档的格式输出，包含 CSS 变量定义。
```

### 步骤 3: 深度分析 (可选)

#### 3.1 配色分析
```
请详细分析这个网站的配色方案:
- 提取所有颜色并分类 (主色、辅助色、中性色、功能色)
- 提供 HEX、RGB、HSL 值
- 说明每种颜色的使用场景
- 分析色彩对比度是否符合 WCAG 标准
```

#### 3.2 排版分析
```
请分析这个网站的排版系统:
- 识别所有使用的字体
- 列出字号层级 (从最小到最大)
- 分析字重使用模式
- 说明行高和字母间距的设置
```

#### 3.3 组件分析
```
请分析这个网站的组件设计:
- 按钮的所有状态 (default, hover, active, disabled)
- 卡片的结构 (背景、边框、阴影、圆角)
- 表单元素的设计风格
- 导航栏的布局和交互
```

### 步骤 4: 生成设计系统文档

将分析结果整理为以下格式:

```markdown
# [项目名称] 设计系统

## 概述
[设计风格、设计理念、目标用户]

## 颜色
[颜色变量、使用指南]

## 排版
[字体、字号、字重]

## 组件
[按钮、卡片、表单等]

## 动画
[缓动、时长、效果]

## 使用示例
[代码片段]
```

---

## 快捷命令

### 使用 /visual-design-analyzer 技能

```
/visual-design-analyzer analyze [URL 或截图]
```

### 分析当前项目

```
/visual-design-analyzer analyze 当前项目
```

这将自动读取项目中的:
- `src/index.css` - CSS 变量和样式定义
- `tailwind.config.js` - Tailwind 配置
- `src/constants/` - 常量文件
- 主要组件文件

### 分析外部网站

```
/visual-design-analyzer analyze https://example.com
```

---

## 输出示例

### 完整设计系统文档

```css
/* TechInk Design System */

:root {
  /* Colors */
  --ink-black: #000000;
  --ink-dark-gray: #333333;
  --ink-medium-gray: #666666;
  --ink-light-gray: #999999;
  --ink-pale-gray: #CCCCCC;
  --ink-white: #FFFFFF;
  --ink-paper: #FAFAFA;

  /* Typography */
  --font-heading: 'Oswald', sans-serif;
  --font-body: 'Roboto', serif;
  --font-mono: 'Fira Code', monospace;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Animation */
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}
```

---

## 最佳实践

1. **保持一致性** - 使用相同的分析模板记录所有设计系统
2. **提供上下文** - 说明每种设计决策的原因
3. **包含示例** - 提供实际使用的代码片段
4. **考虑可访问性** - 检查颜色对比度和键盘导航
5. **响应式设计** - 分析多个断点的表现

## 工具推荐

| 用途 | 工具 |
|------|------|
| 颜色提取 | https://imagecolorpicker.com/ |
| 字体识别 | https://www.whatfontis.com/ |
| 截图工具 | https://www.screentogif.com/ |
| 对比度检查 | https://webaim.org/resources/contrastchecker/ |
| 设计灵感 | https://www.awwwards.com/ |

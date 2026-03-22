# 组件模板使用指南

本目录包含 TechInk Web 项目的标准组件模板，用于确保代码风格和设计的一致性。

## 模板文件

### 1. SectionTemplate.tsx
**用途**: Section 页面区块组件模板

适用于：
- 需要滚动触发动画的内容区块
- 包含标题 + 列表/网格的内容区域
- 需要统一入场动画的章节

**使用步骤**:
1. 复制 `SectionTemplate.tsx` 到 `src/sections/`
2. 重命名为 `[YourSection]Section.tsx`
3. 替换所有 `[YourSection]` 为实际名称
4. 在 `src/config.ts` 中添加对应的配置
5. 在 `src/App.tsx` 中引入并使用

**特性**:
- ✅ 遵循 React Hooks 规则
- ✅ 自动处理 `prefersReducedMotion`
- ✅ GSAP 上下文自动清理
- ✅ 标准的响应式布局
- ✅ 悬停交互效果

---

### 2. CardTemplate.tsx
**用途**: 卡片组件模板

适用于：
- 文章卡片
- 产品卡片
- 团队成员卡片
- 任何内容展示卡片

**使用步骤**:
1. 复制 `CardTemplate.tsx` 到 `src/components/`
2. 根据需求调整 props
3. 直接导入使用

**特性**:
- ✅ 多种悬停效果 (scale, lift, glow)
- ✅ 可选图片灰度效果
- ✅ 灵活的布局选项
- ✅ 可作为链接、按钮或纯展示

**示例**:
```tsx
import { Card } from '@/components/CardTemplate';

// 基础用法
<Card
  title="文章标题"
  category="分类"
  description="描述文本"
  image="/path/to/image.jpg"
/>

// 作为链接
<Card
  title="点击我"
  href="/article/1"
  image="/path/to/image.jpg"
  hoverEffect="lift"
/>

// 无边框卡片
<Card
  title="极简卡片"
  showBorder={false}
  hoverEffect="none"
/>
```

---

### 3. ButtonTemplate.tsx
**用途**: 按钮组件模板

适用于：
- 表单提交
- 导航操作
- 下载按钮
- 任何交互按钮

**使用步骤**:
1. 复制 `ButtonTemplate.tsx` 到 `src/components/`
2. 根据品牌需求调整样式（当前为 E-ink 风格）
3. 直接导入使用

**变体**:
- `primary` - 黑底白字，悬停反转
- `outline` - 描边样式
- `apple` - 半透明毛玻璃风格
- `ghost` - 幽灵按钮
- `link` - 链接样式

**示例**:
```tsx
import { Button } from '@/components/ButtonTemplate';

// 基础用法
<Button>点击我</Button>

// 不同变体
<Button variant="primary">主要按钮</Button>
<Button variant="outline">描边按钮</Button>
<Button variant="apple">Apple 风格</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="lg">大按钮</Button>

// 带图标
<Button leftIcon={<Icon />}>带图标</Button>

// 状态
<Button disabled>禁用</Button>
<Button loading>加载中</Button>
```

---

### 4. useScrollAnimationTemplate.ts
**用途**: 滚动动画 Hook 模板

适用于：
- 元素进入视口时的动画
- 滚动绑定的视差效果
- 可复用的动画逻辑

**使用步骤**:
1. 复制 `useScrollAnimationTemplate.ts` 到 `src/hooks/`
2. 根据需求调整预设动画
3. 在组件中导入使用

**预设 Hook**:
- `useFadeInUp` - 淡入上升
- `useScaleIn` - 缩放淡入
- `useSlideIn` - 滑入动画

**示例**:
```tsx
import { useFadeInUp, useScrollAnimation } from '@/hooks/useScrollAnimation';

// 使用预设
const { ref } = useFadeInUp();
<div ref={ref}>我会淡入上升</div>

// 自定义动画
const { ref } = useScrollAnimation((element, timeline) => {
  timeline.from(element, {
    x: -100,
    opacity: 0,
    duration: 1,
    ease: 'power4.out',
  });
});

// 视差效果
const { ref } = useScrollAnimation((element, timeline) => {
  timeline.to(element, {
    y: -100,
    ease: 'none',
  });
}, { scrub: true });
```

---

## 设计令牌 (Design Tokens)

所有模板都使用 `src/types/design-tokens.ts` 中定义的设计常量。

**导入使用**:
```tsx
import {
  BRAND_COLORS,
  FONT_FAMILY,
  SPACING,
  DURATION,
  EASING,
  BUTTON_CLASSES,
  CARD_CLASSES,
} from '@/types/design-tokens';
```

---

## 代码风格检查清单

创建新组件时，确保：

- [ ] 所有 Refs 在条件判断之前声明
- [ ] 所有 State 在条件判断之前声明
- [ ] 所有 Hooks 在条件判断之前调用
- [ ] 条件渲染 (`if (!shouldRender) return null`) 在所有 Hooks 之后
- [ ] 使用 `useReduceMotion` 检测动画偏好
- [ ] GSAP 动画使用 `gsap.context()` 并在返回时清理
- [ ] 添加 ARIA 标签
- [ ] 支持键盘导航
- [ ] 使用 `cn()` 工具函数合并类名
- [ ] 图片添加 width/height 防止 CLS
- [ ] 使用设计令牌而非硬编码值

---

## 常见问题

### Q: 为什么要遵循这个模板结构？
**A**: 这个结构确保：
1. React Hooks 规则不被违反
2. 动画正确清理，防止内存泄漏
3. 代码一致性，便于维护
4. 性能优化和无障碍支持

### Q: 可以修改模板吗？
**A**: 可以！模板是起点，根据需求调整。但保持核心结构（Refs → State → Hooks → 条件判断 → JSX）。

### Q: 如何添加新的预设动画？
**A**: 在 `useScrollAnimationTemplate.ts` 中添加新的预设 Hook 函数，参考现有的 `useFadeInUp` 等实现。

### Q: 设计令牌不够用怎么办？
**A**: 在 `design-tokens.ts` 中添加新的常量，保持类型安全和集中管理。

---

## 下一步

1. 阅读完整的 `ARTSTYLE.md` 设计指南
2. 查看 `src/sections/` 中的实际组件示例
3. 查看 `src/components/` 中的 shadcn/ui 组件
4. 开始创建你的第一个组件！

---

*更新时间: 2026-03-02*

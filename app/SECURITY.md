# TechInk Web Security

本文档记录了 TechInk Web 项目的安全实践和配置。

## 安全头配置

项目已配置以下安全头（在 `index.html` 中）：

### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https:;
connect-src 'self';
media-src 'self';
object-src 'none';
frame-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

### 其他安全头
- `X-Content-Type-Options: nosniff` - 防止 MIME 类型嗅探
- `X-Frame-Options: DENY` - 防止点击劫持
- `X-XSS-Protection: 1; mode=block` - XSS 过滤
- `Referrer-Policy: strict-origin-when-cross-origin` - 控制 Referrer 信息

## React 安全最佳实践

### 1. XSS 防护
- 所有用户输入都通过 React 的自动转义处理
- 避免使用 `dangerouslySetInnerHTML`
- 图片 src 使用静态路径或受控的 URL

### 2. 依赖管理
- 定期运行 `npm audit` 检查漏洞
- 使用 `npm outdated` 检查过期依赖
- 锁定依赖版本以避免意外更新

### 3. 构建安全
- 生产构建自动移除 console 和 debugger 语句
- Source maps 默认禁用，可通过环境变量启用
- 代码分割以隔离潜在问题

## 环境变量管理

敏感配置通过环境变量管理：
- 复制 `.env.example` 到 `.env.local`
- 永远不要提交 `.env.local` 到版本控制
- 所有 `VITE_` 前缀变量会暴露给客户端

## 更新记录

- 2026-03-02: 添加 CSP 和基础安全头
- 2026-03-02: 修复 React Hooks 规则违反
- 2026-03-02: 优化依赖项和内存管理

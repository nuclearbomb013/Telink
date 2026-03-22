# TechInk Web 部署指南

本文档说明如何构建和部署 TechInk Web 应用。

## 前置要求

- Node.js 18+ 
- npm 9+
- Git

## 安装依赖

```bash
cd E:\KIMI_web\app
npm install
```

## 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，设置必要的环境变量：
```env
VITE_APP_NAME=TechInk
VITE_APP_URL=https://your-domain.com
VITE_NEWSLETTER_API_URL=https://api.your-domain.com/subscribe
```

## 本地开发

```bash
npm run dev
```

开发服务器将在 http://localhost:5173 启动

## 生产构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 构建优化

- **代码分割**: 自动按 vendor、animations、ui 分包
- **资源优化**: 图片、CSS 自动优化
- **Tree Shaking**: 移除未使用代码
- **Gzip**: 资源自动压缩

## 部署选项

### 1. 静态托管 (推荐)

#### Vercel
```bash
npm i -g vercel
vercel --prod
```

#### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Cloudflare Pages
- 连接 Git 仓库
- 构建设置:
  - Build command: `npm run build`
  - Build output: `dist`

### 2. Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```bash
docker build -t techink-web .
docker run -p 80:80 techink-web
```

### 3. 传统服务器

将 `dist/` 目录内容上传到 Web 服务器根目录。

## 部署后检查清单

- [ ] 网站正常加载
- [ ] 所有图片正确显示
- [ ] 动画正常运行
- [ ] 表单可以提交
- [ ] 响应式布局正常
- [ ] CSP 头正确设置
- [ ] HTTPS 已启用

## 性能监控

- 使用 Lighthouse 进行性能审计
- 启用 Real User Monitoring (RUM)
- 监控 Core Web Vitals

## 故障排查

### 构建失败
1. 删除 `node_modules` 和 `package-lock.json`
2. 运行 `npm install`
3. 重新构建

### 运行时错误
1. 检查浏览器控制台
2. 确认环境变量正确设置
3. 验证 API 端点可访问

## CI/CD 配置

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      # 添加部署步骤
```

## 更新记录

- 2026-03-02: 添加代码分割和构建优化
- 2026-03-02: 添加 CSP 安全策略
- 2026-03-02: 修复 React Hooks 规则违反

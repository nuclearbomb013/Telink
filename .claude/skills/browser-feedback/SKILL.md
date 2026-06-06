---
name: browser-feedback
description: Get live browser feedback during development. Take screenshots, inspect console/network logs, query DOM elements, run JS in the page, check performance metrics, and audit accessibility — all through a Playwright-controlled Chromium browser connected to your local dev server.
---

# Browser Feedback Skill

Real-time browser feedback for UI development. Connects to your local dev server (e.g. `http://localhost:5173`) via an MCP-controlled Chromium browser, allowing Claude Code to see what the user sees — screenshots, errors, network activity, DOM state, performance, and accessibility.

## Prerequisites

Before first use, install Chromium for Playwright:

```bash
cd E:\KIMI_web\.claude\skills\browser-feedback\mcp-server
npm install
npx playwright install chromium
```

## Tools

All tools are exposed via the MCP server (`browser-feedback`). Claude Code loads them automatically when the MCP server is configured.

### Visual Feedback

| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate browser to a URL. Launch Chromium if not running. Clears console/network logs. |
| `browser_reload` | Reload the current page. Use after making code changes. |
| `browser_screenshot` | Capture a screenshot (full page or viewport). Returns a file path — use the Read tool to view the image. Supports `selector` for element-level capture. |

### Diagnostic Feedback

| Tool | Description |
|------|-------------|
| `browser_get_console` | Get browser console logs. Filter by level: `error`, `warning`, `log`, `info`, `debug`, or `all`. |
| `browser_get_network` | Get network requests. Filter by status (`ok`, `error`, `pending`) or resource type (`xhr`, `fetch`, `script`, `stylesheet`, etc.). |
| `browser_get_dom` | Query an element by CSS selector. Returns existence, text, attributes, bounding box, and visibility. |
| `browser_evaluate` | Execute arbitrary JavaScript in the page. Use to read React state, localStorage, computed styles, or any runtime value. |

### Quality Feedback

| Tool | Description |
|------|-------------|
| `browser_get_metrics` | Collect performance metrics: navigation timing, paint timing, LCP, memory usage. |
| `browser_check_a11y` | Run heuristic accessibility audit: missing alt text, empty buttons, unlabeled inputs, low contrast warnings. |

## Workflows

### Workflow 1: Visual Review (most common)

```
1. browser_navigate  { url: "http://localhost:5173" }
2. browser_screenshot { fullPage: true }
3. [Read the screenshot file] → Analyze visual quality
4. [Edit code based on findings]
5. browser_reload
6. browser_screenshot { fullPage: true }
7. [Compare before/after]
```

### Workflow 2: Bug Investigation

```
1. browser_navigate  { url: "http://localhost:5173/some-page" }
2. browser_get_console { level: "error" }      → Find JS errors
3. browser_get_network { statusFilter: "error" } → Find failed requests
4. [Diagnose and fix]
5. browser_reload
6. browser_get_console { level: "all" }        → Verify no errors
```

### Workflow 3: DOM Debugging

```
1. browser_get_dom { selector: ".problematic-element" }
   → Check if it exists, its dimensions, visibility, attributes
2. browser_evaluate { script: "document.querySelector('.cls').style.display" }
   → Read computed/runtime state
3. [Fix the issue in code]
4. browser_reload
5. browser_get_dom { selector: ".fixed-element" }
   → Verify the fix
```

### Workflow 4: Performance Check

```
1. browser_navigate  { url: "http://localhost:5173" }
2. browser_get_metrics
   → Check LCP, navigation timing, memory usage
3. [Optimize if needed]
4. browser_reload
5. browser_get_metrics
   → Compare improvement
```

### Workflow 5: Accessibility Audit

```
1. browser_navigate  { url: "http://localhost:5173" }
2. browser_check_a11y
   → Review missing alt texts, empty buttons, unlabeled inputs
3. [Fix a11y issues]
4. browser_reload
5. browser_check_a11y
   → Verify all fixed
```

## Development Server

The browser connects to your Vite dev server at `http://localhost:5173`. Make sure it's running:

```bash
cd E:\KIMI_web\app && npm run dev
```

For the backend API (port 8000), use the same workflow — just navigate to `http://localhost:8000/docs` for FastAPI Swagger.

## Tips

1. **After every code change**: `browser_reload` → `browser_screenshot` to see the visual result
2. **Console logs persist**: Use `browser_get_console { level: "error" }` after reload to catch new errors
3. **Network filtering**: Use `browser_get_network { statusFilter: "error" }` to spot 404s/500s
4. **DOM dimensions**: When alignment looks off, use `browser_get_dom` to check actual pixel values
5. **Read state**: When you need React component state, use `browser_evaluate` to access `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` or custom stores

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Browser not launched" | Run `browser_navigate` first |
| Screenshot is blank | Dev server may not be running at the URL |
| "Connection refused" | Check dev server is running on port 5173 |
| Chromium not found | Run `npx playwright install chromium` |
| Tool not available | Check MCP server is configured in settings.local.json |

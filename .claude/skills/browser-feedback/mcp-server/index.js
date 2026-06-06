#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
// ---------------------------------------------------------------------------
// Browser Manager
// ---------------------------------------------------------------------------
class BrowserManager {
    browser = null;
    page = null;
    consoleLogs = [];
    networkRequests = [];
    currentUrl = "";
    screenshotDir;
    constructor() {
        this.screenshotDir = join(tmpdir(), "browser-feedback-screenshots");
        mkdirSync(this.screenshotDir, { recursive: true });
    }
    async launch(headed = false) {
        if (this.browser)
            return;
        this.browser = await chromium.launch({
            headless: !headed,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        process.stderr.write("[browser-feedback] Chromium launched\n");
    }
    async ensurePage() {
        if (!this.browser)
            await this.launch();
        if (!this.page) {
            const context = await this.browser.newContext({
                viewport: { width: 1440, height: 900 },
                deviceScaleFactor: 1,
            });
            this.page = await context.newPage();
            this.hookPage(this.page);
        }
        return this.page;
    }
    hookPage(page) {
        // Collect console
        page.on("console", (msg) => {
            this.consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now(),
                location: msg.location().url
                    ? `${msg.location().url}:${msg.location().lineNumber || 0}`
                    : "unknown",
            });
        });
        // Collect network
        page.on("request", (req) => {
            const entry = {
                url: req.url(),
                method: req.method(),
                status: 0,
                statusText: "pending",
                resourceType: req.resourceType(),
                duration: 0,
                size: 0,
                timestamp: Date.now(),
            };
            this.networkRequests.push(entry);
            // Store start time on the request object
            req._startTime = Date.now();
        });
        page.on("response", async (res) => {
            const req = res.request();
            const startTime = req._startTime || Date.now();
            // Find matching entry and update it
            const entry = this.networkRequests.find((e) => e.url === req.url() && e.status === 0);
            if (entry) {
                entry.status = res.status();
                entry.statusText = res.statusText();
                entry.duration = Date.now() - startTime;
                entry.size = (await res.body().catch(() => Buffer.alloc(0))).length;
            }
        });
        page.on("requestfailed", (req) => {
            const startTime = req._startTime || Date.now();
            const entry = this.networkRequests.find((e) => e.url === req.url() && e.status === 0);
            if (entry) {
                entry.status = 0;
                entry.statusText = "failed";
                entry.duration = Date.now() - startTime;
                entry.error = req.failure()?.errorText || "request failed";
            }
        });
    }
    async navigate(url) {
        const page = await this.ensurePage();
        this.consoleLogs = [];
        this.networkRequests = [];
        this.currentUrl = url;
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        process.stderr.write(`[browser-feedback] Navigated to ${url}\n`);
    }
    async reload() {
        if (!this.page || !this.currentUrl)
            throw new Error("No page to reload. Navigate first.");
        this.consoleLogs = [];
        this.networkRequests = [];
        await this.page.reload({ waitUntil: "networkidle", timeout: 30000 });
        process.stderr.write("[browser-feedback] Page reloaded\n");
    }
    async screenshot(fullPage, selector) {
        const page = await this.ensurePage();
        const ts = Date.now();
        const filename = `screenshot-${ts}.png`;
        const filepath = join(this.screenshotDir, filename);
        if (selector) {
            const el = page.locator(selector);
            await el.screenshot({ path: filepath });
        }
        else {
            await page.screenshot({ path: filepath, fullPage });
        }
        return { filepath, filename };
    }
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            process.stderr.write("[browser-feedback] Browser closed\n");
        }
    }
}
const bm = new BrowserManager();
// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
const server = new McpServer({
    name: "browser-feedback",
    version: "1.0.0",
    description: "Browser feedback tools — screenshot, console, network, DOM, metrics, a11y. Connects to your local dev server via Chromium.",
});
// 1 — Navigate
server.tool("browser_navigate", "Navigate the browser to a URL (e.g. http://localhost:5173). Also launches the browser if not already running. Clears previous console/network logs.", { url: z.string().describe("Full URL to navigate to") }, async ({ url }) => {
    try {
        await bm.navigate(url);
        return {
            content: [
                { type: "text", text: JSON.stringify({ ok: true, url, message: "Page loaded successfully" }) },
            ],
        };
    }
    catch (e) {
        return {
            content: [
                { type: "text", text: JSON.stringify({ ok: false, error: String(e) }) },
            ],
        };
    }
});
// 2 — Reload
server.tool("browser_reload", "Reload the current page. Clears previous console/network logs. Useful after making code changes.", {}, async () => {
    try {
        await bm.reload();
        return {
            content: [
                { type: "text", text: JSON.stringify({ ok: true, url: bm.currentUrl, message: "Page reloaded" }) },
            ],
        };
    }
    catch (e) {
        return {
            content: [
                { type: "text", text: JSON.stringify({ ok: false, error: String(e) }) },
            ],
        };
    }
});
// 3 — Screenshot
server.tool("browser_screenshot", "Take a screenshot of the current page (full page or viewport). Returns the file path; use the Read tool to view the image.", {
    fullPage: z.boolean().default(false).describe("Capture full scrollable page (true) or just the viewport (false)"),
    selector: z.string().optional().describe("CSS selector of a specific element to capture"),
}, async ({ fullPage, selector }) => {
    try {
        const { filepath, filename } = await bm.screenshot(fullPage, selector);
        const dimensions = await bm.ensurePage().then((p) => p.evaluate(() => ({
            viewportW: window.innerWidth,
            viewportH: window.innerHeight,
            scrollH: document.body.scrollHeight,
        })));
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        ok: true,
                        screenshotPath: filepath,
                        filename,
                        dimensions,
                        viewportW: dimensions.viewportW,
                        viewportH: dimensions.viewportH,
                        fullPageHeight: dimensions.scrollH,
                        hint: "Use the Read tool to view the screenshot image at the path above",
                    }),
                },
            ],
        };
    }
    catch (e) {
        return {
            content: [
                { type: "text", text: JSON.stringify({ ok: false, error: String(e) }) },
            ],
        };
    }
});
// 4 — Console logs
server.tool("browser_get_console", "Get collected browser console logs. Filters by type (error, warning, log, info, debug).", {
    level: z.enum(["all", "error", "warning", "log", "info", "debug"]).default("all").describe("Filter by log level"),
    limit: z.number().default(50).describe("Max number of entries to return"),
}, async ({ level, limit }) => {
    let logs = bm.consoleLogs;
    if (level !== "all") {
        logs = logs.filter((l) => l.type === level);
    }
    const result = logs.slice(-limit).map((l) => ({
        type: l.type,
        text: l.text,
        location: l.location,
    }));
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    ok: true,
                    total: bm.consoleLogs.length,
                    showing: result.length,
                    filter: level,
                    logs: result,
                }),
            },
        ],
    };
});
// 5 — Network requests
server.tool("browser_get_network", "Get collected network requests. Can filter by status code or resource type.", {
    statusFilter: z.enum(["all", "ok", "error", "pending"]).default("all").describe("all=show all, ok=2xx/3xx, error=4xx/5xx/failed, pending=in-flight"),
    resourceType: z.string().optional().describe("Filter by resource type: xhr, fetch, script, stylesheet, image, font, document"),
    limit: z.number().default(50).describe("Max entries to return"),
}, async ({ statusFilter, resourceType, limit }) => {
    let items = bm.networkRequests;
    if (statusFilter === "ok")
        items = items.filter((r) => r.status >= 200 && r.status < 400);
    else if (statusFilter === "error")
        items = items.filter((r) => r.status >= 400 || r.status === 0);
    else if (statusFilter === "pending")
        items = items.filter((r) => r.status === 0);
    if (resourceType)
        items = items.filter((r) => r.resourceType === resourceType);
    const result = items.slice(-limit).map((r) => ({
        url: r.url,
        method: r.method,
        status: r.status,
        statusText: r.statusText,
        type: r.resourceType,
        durationMs: Math.round(r.duration),
        sizeBytes: r.size,
        error: r.error,
    }));
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    ok: true,
                    total: bm.networkRequests.length,
                    showing: result.length,
                    statusFilter,
                    requests: result,
                }),
            },
        ],
    };
});
// 6 — DOM query
server.tool("browser_get_dom", "Inspect an element by CSS selector. Returns existence, text content, attribute values, and bounding box.", {
    selector: z.string().describe("CSS selector to query, e.g. '.btn-primary' or '#hero-title'"),
}, async ({ selector }) => {
    try {
        const page = await bm.ensurePage();
        const result = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el)
                return { exists: false };
            const rect = el.getBoundingClientRect();
            return {
                exists: true,
                tagName: el.tagName.toLowerCase(),
                text: el.textContent?.trim().slice(0, 500) || "",
                innerHTML: el.innerHTML.slice(0, 500),
                attributes: Array.from(el.attributes).reduce((acc, a) => ({ ...acc, [a.name]: a.value }), {}),
                rect: {
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    top: Math.round(rect.top),
                    right: Math.round(rect.right),
                    bottom: Math.round(rect.bottom),
                    left: Math.round(rect.left),
                },
                visible: !!el.offsetParent,
            };
        }, selector);
        return {
            content: [{ type: "text", text: JSON.stringify({ ok: true, selector, ...result }) }],
        };
    }
    catch (e) {
        return {
            content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(e) }) }],
        };
    }
});
// 7 — Evaluate JavaScript
server.tool("browser_evaluate", "Execute arbitrary JavaScript in the browser page context and return the result. Use for reading runtime state (React state, store values, computed styles, etc.).", {
    script: z.string().describe("JavaScript code to execute. Must return a value (will be serialized as JSON). Example: 'document.title' or 'JSON.stringify(window.__MY_STATE__)'"),
}, async ({ script }) => {
    try {
        const page = await bm.ensurePage();
        const result = await page.evaluate((code) => {
            try {
                const val = eval(code);
                return { type: typeof val, value: val };
            }
            catch (err) {
                return { type: "error", value: String(err) };
            }
        }, script);
        return {
            content: [{ type: "text", text: JSON.stringify({ ok: true, result }) }],
        };
    }
    catch (e) {
        return {
            content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(e) }) }],
        };
    }
});
// 8 — Performance metrics
server.tool("browser_get_metrics", "Collect page performance metrics including navigation timing, paint timing, and layout stability.", {}, async () => {
    try {
        const page = await bm.ensurePage();
        const metrics = await page.evaluate(() => {
            const nav = performance.getEntriesByType("navigation")[0];
            const paint = performance.getEntriesByType("paint");
            const lcp = performance.getEntriesByType("largest-contentful-paint");
            const paintTimings = {};
            for (const p of paint) {
                paintTimings[p.name] = Math.round(p.startTime);
            }
            const lcpTiming = lcp.length > 0 ? Math.round(lcp[lcp.length - 1].startTime) : null;
            return {
                navigationTiming: nav
                    ? {
                        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
                        loadComplete: Math.round(nav.loadEventEnd),
                        domInteractive: Math.round(nav.domInteractive),
                        firstByte: Math.round(nav.responseStart),
                        dnsTime: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
                        tcpTime: Math.round(nav.connectEnd - nav.connectStart),
                    }
                    : null,
                paintTimings,
                largestContentfulPaintMs: lcpTiming,
                clsScore: "not tracked",
                memory: performance?.memory
                    ? {
                        usedJsHeapMB: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
                    }
                    : null,
            };
        });
        return {
            content: [{ type: "text", text: JSON.stringify({ ok: true, metrics }) }],
        };
    }
    catch (e) {
        return {
            content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(e) }) }],
        };
    }
});
// 9 — Accessibility check (simple a11y audit via injected script)
server.tool("browser_check_a11y", "Run basic accessibility checks on the current page. Checks for: missing alt text, empty buttons, low contrast warnings, missing form labels, ARIA issues. For a full audit, use browser_evaluate with axe-core.", {}, async () => {
    try {
        const page = await bm.ensurePage();
        const issues = await page.evaluate(() => {
            const problems = [];
            // Missing alt on images
            document.querySelectorAll("img:not([alt])").forEach((el) => {
                problems.push({
                    type: "missing-alt",
                    element: el.outerHTML.slice(0, 120),
                    detail: "Image is missing alt attribute",
                });
            });
            // Empty buttons / links without text
            document.querySelectorAll('button, a[role="button"]').forEach((el) => {
                const text = el.innerText?.trim() || "";
                const hasAria = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
                if (!text && !hasAria) {
                    problems.push({
                        type: "empty-button",
                        element: el.outerHTML.slice(0, 120),
                        detail: "Button/link has no visible text or aria-label",
                    });
                }
            });
            // Inputs without labels
            document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button'])").forEach((el) => {
                const id = el.id;
                const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
                const hasAria = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
                const hasPlaceholder = el.hasAttribute("placeholder");
                if (!hasLabel && !hasAria && !hasPlaceholder) {
                    problems.push({
                        type: "unlabeled-input",
                        element: el.outerHTML.slice(0, 120),
                        detail: "Input has no associated label, aria-label, or placeholder",
                    });
                }
            });
            // Low contrast check (heuristic — detect light gray text on white)
            document.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6, a, li, td, th").forEach((el) => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const bg = style.backgroundColor;
                // Very basic: flag gray-ish text on white-ish bg
                if (color.includes("153") || color.includes("170") || color.includes("187") || color.includes("204")) {
                    if (bg === "rgba(0, 0, 0, 0)" || bg.includes("255, 255, 255") || bg.includes("250")) {
                        problems.push({
                            type: "low-contrast-warning",
                            element: el.outerHTML.slice(0, 120),
                            detail: `Possible low contrast: text color ${color} on ${bg === "rgba(0, 0, 0, 0)" ? "transparent/white" : bg}`,
                        });
                    }
                }
            });
            return problems;
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        ok: true,
                        issueCount: issues.length,
                        issues: issues.slice(0, 30),
                        note: "Basic heuristic check. For comprehensive a11y audit, run axe-core via browser_evaluate.",
                    }),
                },
            ],
        };
    }
    catch (e) {
        return {
            content: [{ type: "text", text: JSON.stringify({ ok: false, error: String(e) }) }],
        };
    }
});
// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("[browser-feedback] MCP server ready (stdio)\n");
}
main().catch((err) => {
    process.stderr.write(`[browser-feedback] Fatal: ${err.message}\n`);
    process.exit(1);
});

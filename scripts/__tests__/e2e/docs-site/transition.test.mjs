/**
 * The page change itself: one transition mechanism, and no unstyled frame.
 *
 * A cross-document view transition is declared in the stylesheet, so the
 * browser holds the old snapshot until the new page can paint. The version this
 * replaced intercepted every click and called `startViewTransition` around a
 * `location.assign`, which resolved the transition before the new document
 * existed: the old page faded out over the bare canvas.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { installSite } from "./_site.mjs";

const site = installSite(test);

const DARK_BG = "rgb(17, 23, 36)";

test("the stylesheet declares the transition, and carries a field behind it", () => {
  const css = readFileSync(join(import.meta.dirname, "..", "..", "..", "..", "packages", "docs", "style.css"), "utf8");

  expect(css, "a cross-document transition is declared").toMatch(/@view-transition\s*\{[^}]*navigation:\s*auto/u);
  expect(css, "the transition root has the page field, not the canvas").toMatch(/::view-transition\s*\{[^}]*background-color:\s*var\(--bg\)/u);
  expect(css, "a stored reduce-motion preference disables it").toMatch(/\[data-motion="reduce"\]\s*\{[^}]*view-transition-name:\s*none/u);
});

test("a page change never paints an unstyled or empty frame", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const frames = [];
  let calls = 0;

  await context.addInitScript(() => {
    localStorage.setItem("rule-mcp-docs-prefs", JSON.stringify({ theme: "dark" }));
  });

  const page = await context.newPage();

  // The page reports its first frame through a binding, so nothing is assigned
  // onto the global object and the sample survives the navigation.
  await page.exposeBinding("__recordFrame", (_source, frame) => {
    frames.push(frame);
  });
  await page.exposeBinding("__recordTransitionCall", () => {
    calls += 1;
  });
  await page.addInitScript(() => {
    const original = Document.prototype.startViewTransition;

    if (typeof original === "function") {
      Document.prototype.startViewTransition = function spied(...args) {
        globalThis.__recordTransitionCall();

        return Reflect.apply(original, document, args);
      };
    }

    requestAnimationFrame(() => {
      globalThis.__recordFrame({
        theme: document.documentElement.dataset.theme ?? null,
        background: getComputedStyle(document.body).backgroundColor,
        text: (document.body?.innerText ?? "").trim().length,
      });
    });
  });

  await page.goto(site.url("index.html"), { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelector("header nav a[href$='getting-started.html']").click());
  await page.waitForURL(/getting-started/u);
  await page.waitForFunction(() => document.body.innerText.includes("Getting started"));

  const first = frames.at(-1);

  expect(first?.theme, "the stored theme is on the root before the first frame").toBe("dark");
  expect(first?.background, "the body paints the dark field on the first frame").toBe(DARK_BG);
  expect(first?.text, "the first frame already carries the page").toBeGreaterThan(200);
  expect(calls, "no script starts a transition of its own").toBe(0);

  await context.close();
});

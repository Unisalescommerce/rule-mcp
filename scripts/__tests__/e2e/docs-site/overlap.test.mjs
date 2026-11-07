/**
 * Nothing sits on top of anything else it did not mean to.
 *
 * Text overlap is measured on block-level containers, per line fragment: an
 * inline span broken across two lines has one union rect that looks like an
 * overlap and is not one. A floating panel is the deliberate exception, allowed
 * only where there is room beside the header.
 */

import { expect, test } from "@playwright/test";

import { allPages, installSite } from "./_site.mjs";

const site = installSite(test);

const MEASURE = () => {
  const prefs = document.querySelector("details[data-part='prefs']");
  const panel = prefs?.querySelector(":scope > summary + menu");
  const floating = Boolean(prefs?.open) && getComputedStyle(panel).position === "absolute";
  const blocks = [...document.querySelectorAll("body p, body li, body h1, body h2, body h3, body h4, body td, body th, body summary, body label, body blockquote")].filter(
    (element) => element.textContent.trim() !== "" && element.matches("p, li, h1, h2, h3, h4, td, th, summary, label, blockquote") && !(floating && prefs.contains(element)),
  );
  const fragments = [];

  for (const element of blocks) {
    if (blocks.some((other) => other !== element && other.contains(element))) {
      continue;
    }

    for (const rect of element.getClientRects()) {
      if (rect.width > 1 && rect.height > 1) {
        fragments.push({ element, rect });
      }
    }
  }

  const pairs = [];

  for (let index = 0; index < fragments.length; index += 1) {
    for (let other = index + 1; other < fragments.length; other += 1) {
      const a = fragments[index];
      const b = fragments[other];

      if (a.element === b.element || a.element.contains(b.element) || b.element.contains(a.element)) {
        continue;
      }

      const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);

      if (x > 2 && y > 2) {
        pairs.push(
          `${a.element.tagName.toLowerCase()} "${a.element.textContent.trim().slice(0, 28)}" over ${b.element.tagName.toLowerCase()} "${b.element.textContent.trim().slice(0, 28)}" (${Math.round(x)}x${Math.round(y)})`,
        );
      }
    }
  }

  return pairs;
};

test("no two text blocks overlap, at a narrow and a wide width", async ({ browser }) => {
  const failures = [];

  for (const width of [320, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();

    for (const out of allPages()) {
      await page.goto(site.url(out));

      for (const pair of await page.evaluate(MEASURE)) {
        failures.push(`${width}px ${out}: ${pair}`);
      }
    }

    await context.close();
  }

  expect(failures, "text blocks that overlap").toEqual([]);
});

test("the open preferences panel covers nothing where the header has no room", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 } });
  const page = await context.newPage();

  await page.goto(site.url("docs/getting-started.html"));
  await page.click("details[data-part='prefs'] summary");

  const geometry = await page.evaluate(() => {
    const panel = document.querySelector("details[data-part='prefs'] summary + menu");
    const heading = document.querySelector("h1");

    return {
      position: getComputedStyle(panel).position,
      panelBottom: panel.getBoundingClientRect().bottom,
      headingTop: heading.getBoundingClientRect().top,
    };
  });

  expect(geometry.position, "narrow screens render the panel in the flow").toBe("static");
  expect(geometry.headingTop, "the page starts below the panel").toBeGreaterThanOrEqual(Math.round(geometry.panelBottom));

  for (const pair of await page.evaluate(MEASURE)) {
    expect(pair, "the open panel overlaps no text").toBe("");
  }

  await context.close();
});
test("the numbered badges centre a digit that fits the circle", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await context.newPage();
  const failures = [];

  for (const [out, selector] of [
    ["docs/architecture.html", "[data-part='step']"],
    ["index.html", "section[data-part='flow'] ol li"],
  ]) {
    await page.goto(site.url(out));

    const rows = await page.evaluate((sel) => {
      const first = document.querySelector(sel);
      const style = getComputedStyle(first, "::before");

      return {
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        circle: Number.parseFloat(style.width),
        circleHeight: Number.parseFloat(style.height),
      };
    }, selector);

    // The body line box is taller than the circle, so an inherited line height
    // pushed the digit off centre. One line, one em: the em box is the digit.
    if (Math.abs(rows.lineHeight - rows.fontSize) > 0.5) {
      failures.push(`${out}: line box ${rows.lineHeight}px for a ${rows.fontSize}px digit`);
    }

    if (rows.fontSize > rows.circleHeight - 4) {
      failures.push(`${out}: a ${rows.fontSize}px digit in a ${rows.circleHeight}px circle`);
    }

    if (Math.abs(rows.circle - rows.circleHeight) > 0.5) {
      failures.push(`${out}: the badge is not a circle (${rows.circle}x${rows.circleHeight})`);
    }
  }

  expect(failures, "badge geometry").toEqual([]);
  await context.close();
});

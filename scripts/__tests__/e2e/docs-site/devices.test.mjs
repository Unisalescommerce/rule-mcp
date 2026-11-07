/**
 * The site on the devices it is read on.
 *
 * Mobile first means the narrow layout is the base and the wide one is an
 * addition, so the phones come first here. Each case asserts what a reader
 * notices: nothing scrolls sideways, the header parts are reachable, and the
 * brand sits on the same line as the menu it belongs to.
 */

import { expect, test } from "@playwright/test";

import { installSite } from "./_site.mjs";

const site = installSite(test);

/** The wide breakpoint, in CSS pixels: 56rem at the default root size. */
const WIDE = 896;

const DEVICES = [
  { name: "phone 320", width: 320, height: 568 },
  { name: "phone 360", width: 360, height: 640 },
  { name: "phone 390", width: 390, height: 844 },
  { name: "phone 414", width: 414, height: 896 },
  { name: "phone landscape", width: 667, height: 375 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
];

const PAGES = ["index.html", "docs/getting-started.html", "docs/surface-map.html"];

test("no device width scrolls a page sideways", async ({ browser }) => {
  const failures = [];

  for (const device of DEVICES) {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height } });
    const page = await context.newPage();

    for (const out of PAGES) {
      await page.goto(site.url(out));

      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

      if (over > 1) {
        failures.push(`${device.name} ${out}: ${over}px over`);
      }
    }

    await context.close();
  }

  expect(failures, "pages that scroll sideways").toEqual([]);
});

test("the brand, the menu and the preferences stay reachable and aligned", async ({ browser }) => {
  const failures = [];

  for (const device of DEVICES) {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height } });
    const page = await context.newPage();

    await page.goto(site.url("index.html"));

    const layout = await page.evaluate(() => {
      const box = (selector) => {
        const element = document.querySelector(selector);

        return element ? element.getBoundingClientRect() : null;
      };

      return {
        brand: box("header p[data-part='brand'] a"),
        navLink: box("header nav a"),
        prefs: box("header details[data-part='prefs'] summary"),
        nav: box("header nav"),
      };
    });

    for (const [part, box] of Object.entries(layout)) {
      if (!box) {
        failures.push(`${device.name}: ${part} is missing`);
        continue;
      }

      const floor = device.width >= WIDE ? 24 : 44;

      if (box.height < floor) {
        failures.push(`${device.name}: ${part} is ${Math.round(box.height)}px, under the ${floor}px target`);
      }
    }

    if (device.width >= WIDE) {
      // One row: the brand, the menu and the trigger share a centre line.
      const centre = (box) => box.top + box.height / 2;
      const spread = Math.max(centre(layout.brand), centre(layout.navLink), centre(layout.prefs)) - Math.min(centre(layout.brand), centre(layout.navLink), centre(layout.prefs));

      if (spread > 2) {
        failures.push(`${device.name}: the header parts are ${Math.round(spread)}px off one line`);
      }
    } else if (layout.nav.top < layout.brand.bottom - 1) {
      failures.push(`${device.name}: the menu sits on the brand row instead of below it`);
    }

    await context.close();
  }

  expect(failures, "header parts that drift or shrink").toEqual([]);
});

test("text at 200% still reflows, and the open panel covers no heading", async ({ browser }) => {
  const failures = [];

  for (const width of [320, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();

    await page.goto(site.url("docs/getting-started.html"));
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });

    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    if (over > 1) {
      failures.push(`${width}px at 200%: ${over}px over`);
    }

    await page.click("details[data-part='prefs'] summary");

    const covers = await page.evaluate(() => {
      const panel = document.querySelector("details[data-part='prefs'] summary + menu").getBoundingClientRect();
      const heading = document.querySelector("h1").getBoundingClientRect();

      return (
        getComputedStyle(document.querySelector("details[data-part='prefs'] summary + menu")).position === "absolute" && panel.bottom > heading.top && panel.left < heading.right
      );
    });

    if (covers && width < 896) {
      failures.push(`${width}px: the open panel covers the heading`);
    }

    await context.close();
  }

  expect(failures, "reflow at 200% text size").toEqual([]);
});

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("resume-backed content, local download, and production assets load", async ({
  page,
  request,
}) => {
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle("Tarun Kishore — Backend Engineer");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The work",
  );
  await expect(
    page.getByRole("heading", {
      name: "Software Development Engineer II",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".impact-strip")).toContainText("9M");
  await expect(page.locator(".impact-strip")).toContainText("15ms");
  await expect(
    page.getByRole("link", { name: "Original Loom" }),
  ).toHaveAttribute("href", "https://github.com/tarunkishore2303/project-loom");
  await expect(page.locator(".email-link")).toHaveAttribute(
    "href",
    "mailto:tarunksu30@gmail.com",
  );
  const resume = await request.get("/Tarun_Kishore_Resume.pdf");
  expect(resume.status()).toBe(200);
  expect(resume.headers()["content-type"]).toContain("application/pdf");
  expect((await resume.body()).subarray(0, 4).toString()).toBe("%PDF");
  expect(failures).toEqual([]);
});

test("request completes, survives broker outage, and resumes on recovery", async ({
  page,
}) => {
  await page.goto("/");
  const lab = page.locator("#request-lab");
  await lab.getByRole("button", { name: "Trace a request" }).click();
  await expect(
    lab.getByRole("button", { name: "Tracing request…" }),
  ).toBeDisabled();
  await expect(lab.locator("figcaption")).toContainText(
    "Work complete. Evidence retained.",
  );
  await lab.getByRole("switch", { name: "Broker offline" }).click();
  await expect(lab.getByRole("switch")).toBeChecked();
  await lab.getByRole("button", { name: "Trace a request" }).click();
  await expect(lab.locator("figcaption")).toContainText(
    "Broker unavailable. Intent survives.",
  );
  await expect(lab.getByRole("button", { name: "Trace again" })).toBeEnabled();
  await lab.getByRole("switch").click();
  await expect(lab.getByRole("switch")).not.toBeChecked();
  await expect(lab.locator("figcaption")).toContainText(
    "Work complete. Evidence retained.",
  );
});

test("broker toggle safely interrupts an in-flight model", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator("#request-lab");
  await lab.getByRole("button", { name: "Trace a request" }).click();
  await lab.getByRole("switch").click();
  await expect(lab.locator("figcaption")).toContainText("Ready when you are.");
  await page.waitForTimeout(3500);
  await expect(lab.locator("figcaption")).toContainText("Ready when you are.");
  await expect(
    lab.getByRole("button", { name: "Trace a request" }),
  ).toBeEnabled();
});

test("responsive layouts remain within viewport and mobile navigation works", async ({
  page,
}) => {
  for (const width of [320, 375, 390, 620, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `overflow at ${width}px`,
    ).toBe(true);
    const heading = await page.getByRole("heading", { level: 1 }).boundingBox();
    expect(heading.x + heading.width).toBeLessThanOrEqual(width);
    if (width === 390) {
      const menu = page.getByRole("button", { name: "Menu" });
      await menu.click();
      await expect(page.getByRole("button", { name: "Close" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page
        .getByRole("navigation")
        .getByRole("link", { name: "Experience" })
        .click();
      await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(page).toHaveURL(/#experience$/);
    }
  }
});

test("keyboard path and WCAG accessibility checks", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(
        results.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map((n) => n.target),
        })),
      ),
    ).toEqual([]);
  }
});

test("capture desktop and mobile for design review", async ({ page }) => {
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `qa/screenshots/${name}-full.png`,
      fullPage: true,
    });
    await page.screenshot({ path: `qa/screenshots/${name}-hero.png` });
  }
});

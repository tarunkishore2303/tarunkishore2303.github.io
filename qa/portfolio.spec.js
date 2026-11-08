import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const themeButton = (page) =>
  page.getByRole("button", { name: "Dark mode", exact: true });
const motionButton = (page) =>
  page.getByRole("button", { name: "Pause animations", exact: true });

async function setTheme(page, theme) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    /^(light|dark)$/,
  );
  if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
    await themeButton(page).click();
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

test("theme follows the system until an explicit choice is saved", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeButton(page)).toHaveAttribute("aria-pressed", "true");
  await themeButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(themeButton(page)).toHaveAttribute("aria-pressed", "false");
  expect(
    await page.evaluate(() => localStorage.getItem("portfolio-theme")),
  ).toBe("light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await themeButton(page).click();
  expect(
    await page.evaluate(() => localStorage.getItem("portfolio-theme")),
  ).toBe("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("motion can be paused and the preference survives reload", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
  await expect(motionButton(page)).toHaveAttribute("aria-pressed", "false");
  await motionButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await expect(motionButton(page)).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(() => localStorage.getItem("portfolio-motion")),
  ).toBe("paused");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await motionButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
  expect(
    await page.evaluate(() => localStorage.getItem("portfolio-motion")),
  ).toBe("running");
});

test("reduced-motion preference starts with motion paused", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await expect(motionButton(page)).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(1100, 350);
  await expect(motionButton(page)).toHaveAttribute("aria-disabled", "true");
  await motionButton(page).click({ force: true });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
  // Reduced motion affects presentation, while the explanatory model still works.
  await page
    .locator("#request-lab")
    .getByRole("button", { name: "Trace a request" })
    .click();
  await expect(page.locator("#request-lab figcaption")).toContainText(
    "Work complete. Evidence retained.",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(motionButton(page)).toHaveAttribute("aria-disabled", "false");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
});

test("3D artwork animates, responds to a mouse, and stops when paused", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (animation) =>
              animation.animationName === "core-hover" &&
              animation.playState === "running",
          ),
      ),
    )
    .toBe(true);
  const plate = page.locator("#request-lab");
  const bounds = await plate.boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width * 0.8,
    bounds.y + bounds.height * 0.25,
  );
  await expect
    .poll(() =>
      plate.evaluate((element) => element.style.getPropertyValue("--tilt-y")),
    )
    .not.toBe("");
  await page.mouse.move(20, 20);
  await expect
    .poll(() =>
      plate.evaluate((element) => element.style.getPropertyValue("--tilt-y")),
    )
    .toBe("");
  await motionButton(page).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
      ),
    )
    .toBe(0);
  await page.mouse.move(
    bounds.x + bounds.width * 0.8,
    bounds.y + bounds.height * 0.25,
  );
  expect(
    await plate.evaluate((element) => getComputedStyle(element).transform),
  ).toBe("none");
});

test("unavailable local storage does not break theme or motion controls", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage is blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await themeButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await motionButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  expect(errors).toEqual([]);
});

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

test("both themes fit small phones, tablets, landscape screens, and wide desktops", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const viewports = [
    [280, 653],
    [320, 568],
    [360, 740],
    [390, 844],
    [480, 320],
    [620, 900],
    [768, 1024],
    [820, 540],
    [1024, 768],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
  ];
  for (const theme of ["light", "dark"]) {
    await setTheme(page, theme);
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${theme} overflow at ${width}×${height}`,
      ).toBe(true);
      const heading = await page
        .getByRole("heading", { level: 1 })
        .boundingBox();
      expect(heading.x).toBeGreaterThanOrEqual(0);
      expect(heading.x + heading.width).toBeLessThanOrEqual(width + 1);
      await expect(themeButton(page)).toBeVisible();
      await expect(motionButton(page)).toBeVisible();
      for (const control of [themeButton(page), motionButton(page)]) {
        const bounds = await control.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      }
    }
  }
});

test("mobile navigation works through the tablet breakpoint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [390, 820, 900]) {
    await page.setViewportSize({ width, height: 700 });
    await page.getByRole("button", { name: "Menu" }).click();
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
  await page.setViewportSize({ width: 901, height: 700 });
  await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("keyboard path and WCAG accessibility checks", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  for (const theme of ["light", "dark"]) {
    await setTheme(page, theme);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 950 });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations,
        `${theme} ${width}px: ` +
          JSON.stringify(
            results.violations.map(({ id, nodes }) => ({
              id,
              targets: nodes.map((n) => n.target),
            })),
          ),
      ).toEqual([]);
    }
  }
});

test("capture both themes on desktop and mobile for design review", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ["light", "dark"]) {
    await setTheme(page, theme);
    for (const [name, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.screenshot({
        path: `qa/screenshots/${theme}-${name}-full.png`,
        fullPage: true,
      });
      await page.screenshot({
        path: `qa/screenshots/${theme}-${name}-hero.png`,
      });
    }
  }
});

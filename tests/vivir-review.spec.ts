import { expect, test } from "@playwright/test";

const approvedRoutes = [
  { path: "/v1-ochre", title: /Ink & Ochre/, accent: "rgb(200, 128, 42)" },
  { path: "/v2-sanctuary", title: /Ink & Sanctuary/, accent: "rgb(168, 137, 79)" },
  { path: "/v4-blue", title: /Ink & Blue/, accent: "rgb(0, 150, 199)" },
] as const;

test("homepage links exactly the three approved versions", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".review-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.evaluateAll((links) => links.map((link) => link.getAttribute("href")))).resolves.toEqual([
    "/v1-ochre",
    "/v2-sanctuary",
    "/v4-blue",
  ]);
  await expect(page.getByText("Oxblood")).toHaveCount(0);
});

for (const route of approvedRoutes) {
  test(`${route.path} renders the approved document`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator("main#main")).toBeVisible();
    await expect(page.locator("#landing")).toBeVisible();
    await expect(page.locator("#story")).toBeHidden();
    await expect(page.locator(".vivir-review-switcher a[aria-current='page']")).toHaveCount(1);

    const activeColor = await page
      .locator(".vivir-review-switcher a[aria-current='page']")
      .evaluate((element) => getComputedStyle(element).color);
    expect(activeColor).toBe(route.accent);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test(`${route.path} switches views, hashes, back navigation, and focus`, async ({ page }) => {
    await page.goto(route.path);
    await page.locator("a[href='#story']").first().click();
    await expect(page).toHaveURL(new RegExp(`${route.path}#story$`));
    await expect(page.locator("#landing")).toBeHidden();
    await expect(page.locator("#story")).toBeVisible();
    await expect(page.locator("nav a[data-view='story']")).toHaveAttribute("aria-current", "page");

    await page.goBack();
    await expect(page.locator("#landing")).toBeVisible();
    await expect(page.locator("#story")).toBeHidden();
  });
}

test("excluded and retired routes are 404", async ({ page }) => {
  for (const path of ["/v3-oxblood", "/v1-deep", "/v2-daylight", "/v3-story", "/v4-ink", "/v5-sanctuary"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});

test("reduced motion keeps approved content readable", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("/v4-blue#story");
  await expect(page.locator("#story")).toBeVisible();
  await expect(page.locator("#story h1")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

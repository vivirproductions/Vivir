import { expect, test } from "@playwright/test";

const approvedRoutes = [
  { path: "/v1-ochre", title: "Vivír", accent: "rgb(200, 128, 42)" },
  { path: "/v2-sanctuary", title: "Vivír", accent: "rgb(168, 137, 79)" },
  { path: "/v4-blue", title: "Vivír", accent: "rgb(0, 150, 199)" },
] as const;

const workTargets = [
  "#film-dinagyang",
  "#film-iloilo-city",
  "#film-coronation-night",
  "#film-engineering-summit",
  "#film-city-celebration",
  "#film-advocacy",
  "#film-talents-night",
  "#film-teaser",
] as const;

const archiveTitles = [
  "Dinagyang 2024: Same-Day Edit",
  "Philippine Engineering Summit 2023: Same-Day Edit",
  "Jesus Reigns 2023: Same-Day Edit",
  "Miss Iloilo 2024 Coronation Night: Same-Day Edit",
  "Lin-ay Sang Iloilo (Taryna): Advocacy Video",
  "Demo Reel V02",
  "Miss World: Advocacy Film",
  "Miss Iloilo (Rona Mae): Advocacy Video",
  "Mr. & Ms. West Talents Night: Highlights",
  "Gail: Debut Teaser",
  "Iloilo Dinagyang Countdown: Reel",
  "Mr. & Ms. West 2024: Teaser",
  "Aesthetic Authority × Miss Iloilo 2023: Teaser Ad",
] as const;

const filterCounts = {
  all: 13,
  corporate: 4,
  tourism: 4,
  highlights: 1,
  predebut: 1,
  reels: 1,
  teasers: 1,
  ads: 1,
} as const;

const publicPages = [
  { suffix: "", name: "landing" },
  { suffix: "/films", name: "films" },
  { suffix: "/studio", name: "studio" },
] as const;

test("homepage links exactly the three approved palettes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("link[rel='icon'][href='/brand/mark-white.png']")).toHaveCount(1);
  const cards = page.locator(".review-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.evaluateAll((links) => links.map((link) => link.getAttribute("href")))).resolves.toEqual([
    "/v1-ochre",
    "/v2-sanctuary",
    "/v4-blue",
  ]);
  await expect(page.getByRole("heading", { name: "Three approved Vivír directions" })).toBeVisible();
  await expect(page.locator(".review-card__version")).toHaveText(["Palette", "Palette", "Palette"]);
  await expect(page.locator(".review-card__name")).toHaveText(["Ochre", "Sanctuary", "Blue"]);
  await expect(page.getByText(/^(V1|V2|V4)$/)).toHaveCount(0);
});

for (const route of approvedRoutes) {
  test(`${route.path} is a landing page only`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator("main#main[data-page='landing']")).toBeVisible();
    await expect(page.locator(".brand__name")).toHaveText("VIVÍR");
    await expect(page.locator(".hero")).toBeVisible();
    await expect(page.locator(".index#work")).toBeVisible();
    await expect(page.locator(".hero__title")).toHaveText("Jesus Reigns 2023 - Vivír");
    await expect(page.locator(".hero__contact")).toHaveText("Contact us");
    await expect(page.locator(".hero__contact")).toHaveAttribute("href", "#contact");
    await expect(page.locator(".index__head .lbl")).toHaveText("Selected work");
    await expect(page.locator(".foot__legal small")).toHaveText("© Vivír. All rights reserved.");
    await expect(page.locator(".films, .studio, #lightbox")).toHaveCount(0);
    await expect(page.locator(".film")).toHaveCount(0);
    await expect(page.locator("form#inquiry")).toBeVisible();
    await expect(page.locator("form#inquiry input[name='website']")).toHaveCount(1);
    await expect(page.locator("form#inquiry input[name='website']")).toHaveAttribute("autocomplete", "off");
    await expect(page.locator("form#inquiry input[name='website']")).toHaveAttribute("data-bwignore", "true");
    await expect(page.locator(".foot__title")).toHaveText("You have a testimony? Let’s talk.");
    await expect(page.locator(".vivir-review-switcher")).toHaveAttribute("aria-label", "Vivír color palettes");
    await expect(page.locator(".vivir-review-switcher a")).toHaveText(["All", "Ochre", "Sanctuary", "Blue"]);
    await expect(page.locator(".vivir-review-switcher a[aria-current='page']")).toHaveCount(1);

    const activeColor = await page
      .locator(".vivir-review-switcher a[aria-current='page']")
      .evaluate((element) => getComputedStyle(element).color);
    expect(activeColor).toBe(route.accent);
    expect(
      await page.locator(".mail").evaluate((mail) => Number.parseFloat(getComputedStyle(mail).fontSize)),
    ).toBeLessThanOrEqual(18);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test(`${route.path}/films is a dedicated Film archive page`, async ({ page }) => {
    const response = await page.goto(`${route.path}/films`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Vivír · Films");
    await expect(page.locator("main#main[data-page='films']")).toBeVisible();
    await expect(page.locator("#films-h")).toHaveText("Film archive");
    await expect(page.locator(".films")).toBeVisible();
    await expect(page.locator(".hero, .index, .studio")).toHaveCount(0);
    await expect(page.locator("#lightbox")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("nav a[data-page='films']")).toHaveAttribute("aria-current", "page");
    await expect(page.locator("form#inquiry")).toBeVisible();
  });

  test(`${route.path}/studio is the Our Testimony about page`, async ({ page }) => {
    const response = await page.goto(`${route.path}/studio`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Vivír · Our Testimony");
    await expect(page.locator("main#main[data-page='studio']")).toBeVisible();
    await expect(page.locator(".studio")).toBeVisible();
    await expect(page.locator("nav a[data-page='studio']")).toHaveText("Our Testimony");
    await expect(page.locator(".studio__h")).toHaveText("Our Testimony");
    await expect(page.locator(".draft")).toHaveText(
      "[DRAFT - no individual testimony has been cleared for publication]",
    );
    await expect(page.locator(".testimony__item")).toHaveCount(3);
    await expect(page.locator(".testimony__slot")).toHaveText([
      "[Testimony placeholder 01]",
      "[Testimony placeholder 02]",
      "[Testimony placeholder 03]",
    ]);
    await expect(page.locator(".testimony__placeholder")).toHaveText([
      "[Name, written story, and publication consent - to be confirmed]",
      "[Name, written story, and publication consent - to be confirmed]",
      "[Name, written story, and publication consent - to be confirmed]",
    ]);
    await expect(page.locator(".testimony__notice")).toHaveText(
      "No person, quote, church, or identifying detail is published in this preview.",
    );
    await expect(page.locator(".hero, .index, .films, #lightbox")).toHaveCount(0);
    await expect(page.locator("nav a[data-page='studio']")).toHaveAttribute("aria-current", "page");
    await expect(page.locator("form#inquiry")).toBeVisible();
  });

  test(`${route.path} maps every Work row to its Film archive URL`, async ({ page }) => {
    await page.goto(`${route.path}#work`);
    const hrefs = await page.locator(".rows .row").evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
    expect(hrefs).toEqual(workTargets.map((target) => `${route.path}/films${target}`));
  });

  test(`${route.path} hero Contact CTA reaches its footer form`, async ({ page }) => {
    await page.goto(route.path);
    await page.locator(".hero__contact").click();
    await expect(page).toHaveURL(new RegExp(`${route.path}#contact$`));
    await expect(page.locator("footer#contact form#inquiry")).toBeVisible();
  });

  for (const publicPage of publicPages) {
    test(`${route.path}${publicPage.suffix || "/"} header Contact reaches its footer form`, async ({ page }) => {
      const path = `${route.path}${publicPage.suffix}`;
      await page.goto(path);
      await page.locator("header nav a[href='#contact']").click();
      await expect(page).toHaveURL(new RegExp(`${path}#contact$`));
      await expect(page.locator("footer#contact form#inquiry")).toBeVisible();
      expect(
        await page.locator("footer#contact").evaluate((footer) => {
          const rect = footer.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        }),
      ).toBe(true);
    });
  }
}

test("Film archive uses the organized source-video titles", async ({ page }) => {
  await page.goto("/v1-ochre/films");
  await expect(page.locator(".films .film .film__cap")).toHaveText(archiveTitles);
});

test("desktop Work index keeps a restrained editorial scale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop type scale only");
  await page.goto("/v1-ochre#work");
  const rowName = page.locator(".row__name").first();
  const metrics = await rowName.evaluate((element) => {
    const row = element.closest(".row");
    return {
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
      rowHeight: row?.getBoundingClientRect().height ?? 0,
    };
  });
  expect(metrics.fontSize).toBeLessThanOrEqual(40);
  expect(metrics.rowHeight).toBeLessThanOrEqual(72);
});

test("mobile Work rows retain a faint background still without using hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile treatment only");
  await page.goto("/v1-ochre#work");
  const rows = await page.locator(".rows .row").evaluateAll((items) =>
    items.map((item) => ({
      hasStill: item.hasAttribute("data-still"),
      background: getComputedStyle(item, "::before").backgroundImage,
      opacity: getComputedStyle(item, "::before").opacity,
    })),
  );
  const cleared = rows.filter((row) => row.hasStill);
  const pending = rows.filter((row) => !row.hasStill);

  expect(cleared).toHaveLength(7);
  expect(cleared.every((row) => row.background !== "none")).toBe(true);
  expect(pending).toHaveLength(1);
  expect(pending[0].background).toBe("none");
});

test("Film archive filters hide unmatched tiles and All restores the archive", async ({ page }) => {
  await page.goto("/v1-ochre/films");
  const films = page.locator(".films .film");
  await expect(page.locator(".films__tabs")).toHaveAttribute("role", "group");
  await expect(page.locator(".films__tabs [role='tab']")).toHaveCount(0);

  for (const [category, expectedCount] of Object.entries(filterCounts)) {
    const filter = page.locator(`.tab[data-cat='${category}']`);
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".films .film:visible")).toHaveCount(expectedCount);

    if (category !== "all") {
      const visibleCategories = await page
        .locator(".films .film:visible")
        .evaluateAll((items) => items.map((item) => item.getAttribute("data-cat")));
      expect(new Set(visibleCategories)).toEqual(new Set([category]));
      const hiddenCategory = category === "corporate" ? "tourism" : "corporate";
      await expect(page.locator(`.films .film[data-cat='${hiddenCategory}']`).first()).toBeHidden();
    }
  }

  await page.locator(".tab[data-cat='all']").click();
  await expect(films).toHaveCount(filterCounts.all);
  await expect(page.locator(".films .film:visible")).toHaveCount(filterCounts.all);
  await expect(page.locator(".films .film[hidden]")).toHaveCount(0);
});

test("Work opens its Film page, resets filters, focuses the target, and Back returns to Work", async ({ page }) => {
  await page.goto("/v1-ochre/films");
  await page.locator(".tab[data-cat='tourism']").click();
  await expect(page.locator(".tab[data-cat='tourism']")).toHaveAttribute("aria-pressed", "true");

  await page.locator("nav a[data-page='landing']").click();
  await expect(page).toHaveURL(/\/v1-ochre#work$/);
  await page.locator(".row[href='/v1-ochre/films#film-dinagyang']").click();
  await expect(page).toHaveURL(/\/v1-ochre\/films#film-dinagyang$/);
  await expect(page.locator(".tab[data-cat='all']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#film-dinagyang")).toBeFocused();
  await expect(page.locator("#film-dinagyang")).toHaveClass(/is-target/);
  await expect(page.locator("#lightbox")).toHaveAttribute("aria-hidden", "true");

  await page.goBack();
  await expect(page).toHaveURL(/\/v1-ochre#work$/);
  await expect(page.locator("main#main[data-page='landing']")).toBeVisible();
});

test("direct Film links preserve the fragment target, focus it, and keep a pending tile inert", async ({ page }) => {
  await page.goto("/v4-blue/films#film-teaser");
  const teaser = page.locator("#film-teaser");
  await expect(page.locator("main#main[data-page='films']")).toBeVisible();
  await expect(teaser).toBeFocused();
  await expect(teaser).toHaveClass(/is-target/);
  expect(await teaser.evaluate((item) => item.matches(":target"))).toBe(true);
  await expect(page.locator(".tab[data-cat='all']")).toHaveAttribute("aria-pressed", "true");

  await page.goto("/v1-ochre/films#film-coronation-night");
  const pending = page.locator("#film-coronation-night");
  await expect(pending).toBeFocused();
  await expect(pending).toHaveClass(/is-target/);
  await expect(pending.locator("[data-clip]")).toHaveCount(0);
  await expect(page.locator("#lightbox")).toHaveAttribute("aria-hidden", "true");
});

test("Our Testimony Contact CTA reaches the dedicated page footer form", async ({ page }) => {
  await page.goto("/v2-sanctuary/studio");
  await page.locator(".studio__contact").click();
  await expect(page).toHaveURL(/\/v2-sanctuary\/studio#contact$/);
  await expect(page.locator("footer#contact form#inquiry")).toBeVisible();
});

test("contact form handles pending and success without reaching real SMTP", async ({ page }) => {
  let markRequestStarted: (() => void) | undefined;
  let releaseResponse: (() => void) | undefined;
  const requestStarted = new Promise<void>((resolve) => {
    markRequestStarted = resolve;
  });

  await page.route("**/api/inquiry", async (route) => {
    markRequestStarted?.();
    await new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await page.goto("/v2-sanctuary/films#contact");
  const form = page.locator("form#inquiry");
  const submit = form.locator(".inquiry__send");
  await form.getByLabel("Name *").fill("Test Sender");
  await form.getByLabel("Email *").fill("sender@example.com");
  await form.getByLabel("Message *").fill("A test inquiry that is intercepted before SMTP.");
  await submit.click();
  await requestStarted;
  await expect(submit).toHaveText("Sending...");
  await expect(submit).toBeDisabled();
  if (!releaseResponse) throw new Error("The intercepted inquiry never reached its pending state.");
  releaseResponse();
  await expect(page.locator("#inquiry-status")).toHaveText("Thank you. Your message is on its way.");
  await expect(form.getByLabel("Name *")).toHaveValue("");
});

test("contact form retains values and focuses API field errors", async ({ page }) => {
  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        field: "email",
        error: "That email address does not look right.",
        errors: [{ field: "email", message: "That email address does not look right." }],
      }),
    }),
  );
  await page.goto("/v1-ochre#contact");
  const form = page.locator("form#inquiry");
  await form.getByLabel("Name *").fill("Test Sender");
  await form.getByLabel("Email *").fill("sender@example.com");
  await form.getByLabel("Message *").fill("Keep this text after the server rejects another field.");
  await form.getByRole("button", { name: "Send inquiry" }).click();
  await expect(form.getByLabel("Email *")).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByLabel("Email *")).toBeFocused();
  await expect(page.locator("#inquiry-email-error")).toHaveText("That email address does not look right.");
  await expect(form.getByLabel("Message *")).toHaveValue("Keep this text after the server rejects another field.");
});

test("contact form offers direct email when the service is unavailable", async ({ page }) => {
  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "The inquiry mailbox is not configured yet. Please email vivir.production@gmail.com directly.",
      }),
    }),
  );
  await page.goto("/v1-ochre/studio#contact");
  const form = page.locator("form#inquiry");
  await form.getByLabel("Name *").fill("Test Sender");
  await form.getByLabel("Email *").fill("sender@example.com");
  await form.getByLabel("Message *").fill("This value must remain after a service failure.");
  await form.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.locator("#inquiry-status")).toHaveText(
    "The inquiry form is being configured. Please email us directly. vivir.production@gmail.com",
  );
  await expect(page.locator("#inquiry-status a[href='mailto:vivir.production@gmail.com']")).toHaveCount(1);
  await expect(page.locator("#inquiry-status a[href='mailto:vivir.production@gmail.com']")).toBeVisible();
  await expect(form.getByLabel("Message *")).toHaveValue("This value must remain after a service failure.");
});

test("contact form keeps a human's message when the honeypot is unexpectedly filled", async ({ page }) => {
  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "We could not send that just now. Please email vivir.production@gmail.com directly.",
      }),
    }),
  );
  await page.goto("/v1-ochre#contact");
  const form = page.locator("form#inquiry");
  await form.getByLabel("Name *").fill("Test Sender");
  await form.getByLabel("Email *").fill("sender@example.com");
  await form.getByLabel("Message *").fill("This message must not be discarded.");
  await form.locator("input[name='website']").evaluate((input) => {
    (input as HTMLInputElement).value = "https://autofill.example";
  });
  await form.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.locator("#inquiry-status")).toHaveText(
    "We could not send that just now. Please email us directly. vivir.production@gmail.com",
  );
  await expect(form.getByLabel("Message *")).toHaveValue("This message must not be discarded.");
});

test("footer content clears the fixed review switcher", async ({ page }) => {
  await page.goto("/v1-ochre#contact");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const clearsSwitcher = await page.evaluate(() => {
    const legal = document.querySelector(".foot__legal")?.getBoundingClientRect();
    const switcher = document.querySelector(".vivir-review-switcher")?.getBoundingClientRect();
    if (!legal || !switcher) return false;
    const intersects = !(
      legal.right <= switcher.left ||
      legal.left >= switcher.right ||
      legal.bottom <= switcher.top ||
      legal.top >= switcher.bottom
    );
    return !intersects;
  });
  expect(clearsSwitcher).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("unregistered routes are 404", async ({ page }) => {
  for (const path of ["/archive", "/unavailable", "/review-only"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});

test("reduced motion keeps the Our Testimony page readable", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("/v4-blue/studio");
  await expect(page.locator("main#main[data-page='studio']")).toBeVisible();
  await expect(page.locator(".studio h2")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

import { test, expect } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`code blocks have distinct token colors in ${theme} mode`, async ({ page }) => {
    await page.goto('/blog/dr-001');
    const code = page.locator('pre > code.language-javascript.hljs').first();
    await expect(code).toBeVisible();
    await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), theme === 'dark');
    const colors = await code.evaluate((element) => ({
      keyword: getComputedStyle(element.querySelector('.hljs-keyword')!).color,
      string: getComputedStyle(element.querySelector('.hljs-string')!).color,
      text: getComputedStyle(element).color,
    }));
    expect(colors.keyword).not.toBe(colors.text);
    expect(colors.string).not.toBe(colors.keyword);
    await expect(code).toContainText("import markdown from '@jackfranklin/rollup-plugin-markdown'");
    await expect(page.locator('pre > code.language-jsx').first()).toContainText('<script>');
    await expect(page.locator('pre > code script')).toHaveCount(0);
  });
}

for (const slug of ['dr-001', 'dr-008']) {
  test(`image zoom preserves layout and scroll in ${slug}`, async ({ page }) => {
    if (slug === 'dr-008') {
      // The immersive article has no images yet; exercise its transformed container.
      await page.route('**/articles/dr-008.html', async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: `${await response.text()}<img src="/assets/articles/dr-001/tailwind_stripped_generated_html.png" alt="Zoom fixture">`,
        });
      });
    }
    await page.goto(`/blog/${slug}`);
    const source = page.locator('.article-content img').first();
    await expect(source).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await source.scrollIntoViewIfNeeded();
    await expect.poll(() => source.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const before = await source.boundingBox();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await source.click();
    const dialog = page.getByRole('dialog', { name: 'Enlarged image' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img')).toBeVisible();
    const assertSourceUnchanged = async () => {
      const current = (await source.boundingBox())!;
      for (const key of ['x', 'y', 'width', 'height'] as const) {
        expect(Math.abs(current[key] - before![key])).toBeLessThan(1);
      }
    };
    await assertSourceUnchanged();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    const zoomed = await dialog.locator('img').boundingBox();
    const viewport = page.viewportSize()!;
    expect(zoomed!.x).toBeGreaterThanOrEqual(0);
    expect(zoomed!.y).toBeGreaterThanOrEqual(0);
    expect(zoomed!.x + zoomed!.width).toBeLessThanOrEqual(viewport.width);
    expect(zoomed!.y + zoomed!.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await assertSourceUnchanged();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await source.click();
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
    await dialog.getByRole('button', { name: 'Close enlarged image' }).click();
    await expect(dialog).not.toBeVisible();
  });
}

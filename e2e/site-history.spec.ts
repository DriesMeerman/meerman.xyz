import { test, expect } from '@playwright/test';
import { siteHistory } from '../src/lib/data/siteHistory.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto('/site-history');
});

test('every release page has a working screenshot in each theme', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Darkmode', exact: true }).click();
    for (const release of siteHistory) {
      const section = page.locator(`[id="release-${release.version}"]`);
      for (const slide of release.pages) {
        if (release.pages.length > 1) await section.getByRole('button', { name: slide.label, exact: true }).click();
        const image = section.locator('.screenshot img');
        const imageTheme = release.originalTheme ? 'original' : theme;
        await expect(image).toHaveAttribute('src', `/site-history/${release.version}/${slide.id}-${imageTheme}.webp`);
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveJSProperty('naturalWidth', 1440);
      }
    }
  }
  await expect(page.locator('nav a[href="/site-history"]')).toHaveCount(0);
});

test('arrows wrap, keyboard works, and theme changes preserve the selection', async ({ page }) => {
  const section = page.locator('[id="release-1.1.0"]');
  const previous = section.getByRole('button', { name: 'Previous page in version 1.1.0' });
  await previous.click();
  await expect(section.getByRole('button', { name: 'Blog', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await previous.press('ArrowRight');
  await expect(section.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await previous.press('ArrowRight');
  await expect(section.getByRole('button', { name: 'Skills', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Darkmode', exact: true }).click();
  await expect(section.locator('.screenshot img')).toHaveAttribute('src', '/site-history/1.1.0/skills-dark.webp');
  await expect(section.getByRole('button', { name: 'Skills', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('v0 preserves the live original, with no invented release date or source tag', async ({ page }) => {
  const section = page.locator('[id="release-0"]');
  await expect(section).toContainText('Before v1');
  await expect(section.locator('time')).toHaveCount(0);
  await expect(section.locator('a')).toHaveCount(0);
  await expect(page.getByText(/\d+ pages? preserved/)).toHaveCount(0);
  await expect(section.locator('.arrows, .page-picker')).toHaveCount(0);
  await section.getByRole('button', { name: 'Enlarge Home screenshot from version 0' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('img')).toHaveAttribute('src', '/site-history/0/home-original-full.webp');
  await expect(dialog.locator('img')).toHaveJSProperty('naturalWidth', 1440);
  await dialog.getByRole('button', { name: 'Close screenshot' }).click();
  await page.getByRole('button', { name: 'Darkmode', exact: true }).click();
  await expect(section.locator('.screenshot img')).toHaveAttribute('src', '/site-history/0/home-original.webp');
});

test('full-page viewer loads the matching image and restores focus on Escape', async ({ page }) => {
  const section = page.locator('[id="release-4.0.0"]');
  await section.getByRole('button', { name: 'Experience', exact: true }).click();
  const opener = section.getByRole('button', { name: 'Enlarge Experience screenshot from version 4.0.0' });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('src', '/site-history/4.0.0/experience-light-full.webp');
  await expect(dialog.locator('img')).toHaveJSProperty('naturalWidth', 1440);
  await expect(dialog.locator('img')).toHaveJSProperty('naturalHeight', 3209);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test('direct loading in dark mode uses dark screenshots after hydration', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/site-history');
  for (const release of siteHistory) {
    await expect(page.locator(`[id="release-${release.version}"] .screenshot img`)).toHaveAttribute('src', `/site-history/${release.version}/home-${release.originalTheme ? 'original' : 'dark'}.webp`);
  }
  await page.reload();
  await expect(page.locator('[id="release-1.1.0"] .screenshot img')).toHaveAttribute('src', '/site-history/1.1.0/home-dark.webp');
  await context.close();
});

test('archive fits narrow screens and appears in the sitemap', async ({ page, request }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('<loc>https://meerman.xyz/site-history</loc>');
});

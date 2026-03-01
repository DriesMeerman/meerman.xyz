import { test, expect } from '@playwright/test';

test.describe('Particles smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('canvas element is present with non-zero dimensions', async ({ page }) => {
    const canvas = page.locator('#particles canvas.particles-canvas');
    await expect(canvas).toBeVisible({ timeout: 10_000 });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('canvas has been initialized by the custom engine', async ({ page }) => {
    const canvas = page.locator('#particles canvas.particles-canvas');
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    const state = await canvas.evaluate((el: HTMLCanvasElement) => ({
      engine: el.dataset.engine,
      ready: el.dataset.ready,
      width: el.width,
      height: el.height,
    }));
    expect(state.engine).toBe('custom');
    expect(state.ready).toBe('true');
    expect(state.width).toBeGreaterThan(0);
    expect(state.height).toBeGreaterThan(0);
  });

  test('particle container has pointer-events: none', async ({ page }) => {
    const pointerEvents = await page.locator('.particle-background').evaluate(
      (el) => getComputedStyle(el).pointerEvents,
    );
    expect(pointerEvents).toBe('none');
  });

  test('clicking spawns additional particles', async ({ page }) => {
    const canvas = page.locator('#particles canvas.particles-canvas');
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    const countBefore = Number(await canvas.getAttribute('data-particle-count'));

    await page.mouse.click(120, 120);
    await page.waitForTimeout(150);

    const countAfter = Number(await canvas.getAttribute('data-particle-count'));

    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test('content behind particles is clickable', async ({ page }) => {
    const navLink = page.locator('nav a').first();
    await expect(navLink).toBeVisible();
    const href = await navLink.getAttribute('href');
    await navLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain(href);
  });

  for (const mode of ['light', 'dark'] as const) {
    test(`particles render in ${mode} mode`, async ({ page }) => {
      if (mode === 'dark') {
        await page.evaluate(() => localStorage.setItem('theme', 'dark'));
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.reload();
        await page.waitForLoadState('networkidle');
      }

      const canvas = page.locator('#particles canvas.particles-canvas');
      await expect(canvas).toBeVisible({ timeout: 10_000 });

      const dimensions = await canvas.evaluate((el: HTMLCanvasElement) => ({
        width: el.width,
        height: el.height,
      }));
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });
  }
});

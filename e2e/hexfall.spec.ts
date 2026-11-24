import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/thingies/hexfall?seed=7';

// The headless shell has no GPU, and current Chromium only falls back to software WebGL when asked.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });

/** Console errors and page errors seen while a test ran. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Opens the game and waits for the first rendered frame. The analytics embed is stubbed so the test stays offline. */
async function open(page: Page, path = ROUTE) {
  await page.route('**/tinylytics.app/**', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.goto(path);
  const root = page.locator('.hexfall');
  await expect(root).toHaveAttribute('data-ready', 'true', { timeout: 20_000 });
  await expect(root).toHaveAttribute('data-status', 'live');
  return root;
}

/** Client position of a hex centre, from the anchor attributes the game puts on its root. */
async function hexPoint(page: Page, q: number, r: number) {
  const root = page.locator('.hexfall');
  const read = async (name: string) => ((await root.getAttribute(name)) ?? '').split(',').map(Number);
  const [ox, oy] = await read('data-hex-origin');
  const [qx, qy] = await read('data-hex-q');
  const [rx, ry] = await read('data-hex-r');
  return { x: ox + q * qx + r * rx, y: oy + q * qy + r * ry };
}

const number = async (root: ReturnType<Page['locator']>, name: string) => Number(await root.getAttribute(name));

test.describe('Hexfall', () => {
  test('loads full screen without the site menu', async ({ page }) => {
    const errors = watchErrors(page);
    const root = await open(page);

    await expect(page.locator('nav')).toHaveCount(0);
    await expect(page.locator('.particle-background')).toHaveCount(0);

    const canvas = root.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(viewport!.width);
    expect(box!.height).toBe(viewport!.height);
    const pixels = await canvas.evaluate((el: HTMLCanvasElement) => ({ width: el.width, height: el.height }));
    expect(pixels.width).toBeGreaterThan(0);
    expect(pixels.height).toBeGreaterThan(0);

    expect(errors).toEqual([]);
  });

  test('exposes its state on the root element', async ({ page }) => {
    const root = await open(page);
    await expect(root).toHaveAttribute('data-screen', 'intro');
    await expect(root).toHaveAttribute('data-level', '1');
    await expect(root).toHaveAttribute('data-wave', '0');
    await expect(root).toHaveAttribute('data-waves', '4');
    await expect(root).toHaveAttribute('data-currency', '160');
    await expect(root).toHaveAttribute('data-core-health', '200');
    await expect(root).toHaveAttribute('data-modules', '1');
    await expect(root).toHaveAttribute('data-land', '37');
    await expect(root).toHaveAttribute('data-seed', '7');
  });

  test('placing a module costs currency, and selling pays part of it back', async ({ page }) => {
    const errors = watchErrors(page);
    const root = await open(page);
    await page.getByTestId('begin').click();
    await expect(root).toHaveAttribute('data-screen', 'play');

    const before = await number(root, 'data-currency');
    const rivet = page.locator('[data-module="rivet"]');
    await rivet.click();
    await expect(rivet).toHaveAttribute('aria-pressed', 'true');

    const spot = await hexPoint(page, 1, 0);
    await page.mouse.click(spot.x, spot.y);
    await expect(root).toHaveAttribute('data-modules', '2');
    await expect(root).toHaveAttribute('data-currency', String(before - 40));
    await expect(page.getByTestId('credits')).toHaveText(String(before - 40));

    // A hex that does not touch the structure is refused and costs nothing.
    const far = await hexPoint(page, -3, 0);
    await page.mouse.click(far.x, far.y);
    await expect(root).toHaveAttribute('data-modules', '2');
    await expect(root).toHaveAttribute('data-currency', String(before - 40));

    // Clicking the new module selects it and offers a partial refund.
    await page.mouse.click(spot.x, spot.y);
    const sell = page.getByTestId('sell');
    await expect(sell).toHaveText('Sell +24');
    await sell.click();
    await expect(root).toHaveAttribute('data-modules', '1');
    await expect(root).toHaveAttribute('data-currency', String(before - 40 + 24));

    expect(errors).toEqual([]);
  });

  test('starting a wave advances the wave readout', async ({ page }) => {
    const errors = watchErrors(page);
    const root = await open(page);
    await page.getByTestId('begin').click();

    const start = page.getByTestId('start-wave');
    await expect(start).toHaveText('Start wave 1');
    await expect(page.getByTestId('wave')).toHaveText('0/4');
    await start.click();
    await expect(root).toHaveAttribute('data-wave', '1');
    await expect(root).toHaveAttribute('data-phase', 'wave');
    await expect(page.getByTestId('wave')).toHaveText('1/4');
    await expect(start).toBeDisabled();

    // Speed and pause are plain toggles.
    const speed = page.getByTestId('speed');
    await speed.click();
    await expect(root).toHaveAttribute('data-speed', '2');
    await page.getByTestId('pause').click();
    await expect(root).toHaveAttribute('data-paused', 'true');
    await page.getByTestId('pause').click();
    await expect(root).toHaveAttribute('data-paused', 'false');

    expect(errors).toEqual([]);
  });

  test('links back to Thingies and switches theme', async ({ page }) => {
    const root = await open(page);
    await expect(root.locator('a.back')).toHaveAttribute('href', '/thingies');

    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
    await root.locator('button.theme').click();
    await expect.poll(() => html.evaluate((el) => el.classList.contains('dark'))).toBe(!wasDark);
    // The scene repaints from the new tokens without leaving the page.
    await expect(root).toHaveAttribute('data-status', 'live');
  });

  test('reads the start level from the URL', async ({ page }) => {
    const root = await open(page, '/thingies/hexfall?seed=12&level=3');
    await expect(root).toHaveAttribute('data-level', '3');
    await expect(root).toHaveAttribute('data-seed', '12');
    await expect(root).toHaveAttribute('data-currency', '240');
  });

  test('controls are large enough to tap', async ({ page }) => {
    const root = await open(page);
    await page.getByTestId('begin').click();
    for (const control of await root.locator('.hud-layer button, .hud-layer a').all()) {
      const box = await control.boundingBox();
      expect(box, await control.innerText()).not.toBeNull();
      expect(box!.height, await control.innerText()).toBeGreaterThanOrEqual(44);
      expect(box!.width, await control.innerText()).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Layout chrome flag', () => {
  test('other pages keep the site menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toHaveCount(1);
  });

  test('lab embeds still render without it', async ({ page }) => {
    await page.goto('/lab?w=year');
    await expect(page.locator('.embed')).toBeVisible();
    await expect(page.locator('nav')).toHaveCount(0);
  });

  test('the lab dashboard keeps it', async ({ page }) => {
    await page.goto('/lab');
    await expect(page.locator('.lab')).toBeVisible();
    await expect(page.locator('nav')).toHaveCount(1);
  });
});

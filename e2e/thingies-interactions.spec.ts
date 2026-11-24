import { test, expect } from '@playwright/test';
import { filterThingies, tagsOf } from '../src/lib/thingies/filter.js';

const entries = [
  { id: 'lab', title: 'Lab', description: 'Widgets for a canvas', tags: ['tool'], href: '/lab' },
  { id: 'game', title: 'Hex asteroid defense', description: 'Defend the grid', tags: ['game'] },
  { id: 'both', title: 'Level editor', description: 'Builds maps', tags: ['tool', 'game'] },
];
const ids = (list: { id: string }[]) => list.map((entry) => entry.id);

test.describe('filterThingies', () => {
  test('returns every entry without a filter', () => {
    expect(ids(filterThingies(entries, {}))).toEqual(['lab', 'game', 'both']);
    expect(ids(filterThingies(entries, { query: '   ' }))).toEqual(['lab', 'game', 'both']);
  });

  test('matches each query word in title, description or tags, ignoring case', () => {
    expect(ids(filterThingies(entries, { query: 'HEX' }))).toEqual(['game']);
    expect(ids(filterThingies(entries, { query: 'canvas' }))).toEqual(['lab']);
    expect(ids(filterThingies(entries, { query: 'game' }))).toEqual(['game', 'both']);
    expect(ids(filterThingies(entries, { query: 'level maps' }))).toEqual(['both']);
    expect(ids(filterThingies(entries, { query: 'level canvas' }))).toEqual([]);
  });

  test('keeps entries with any selected tag, combined with the query', () => {
    expect(ids(filterThingies(entries, { tags: ['tool'] }))).toEqual(['lab', 'both']);
    expect(ids(filterThingies(entries, { tags: ['tool', 'game'] }))).toEqual(['lab', 'game', 'both']);
    expect(ids(filterThingies(entries, { tags: ['game'], query: 'editor' }))).toEqual(['both']);
  });

  test('lists tags in order of first use', () => {
    expect(tagsOf(entries)).toEqual(['tool', 'game']);
  });
});

test.describe('/thingies', () => {
  const cards = (page: import('@playwright/test').Page) => page.locator('.thingy-card');

  test.beforeEach(async ({ page }) => {
    await page.goto('/thingies');
    await page.waitForLoadState('networkidle');
  });

  test('shows the lab and the game in order', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Thingies');
    await expect(cards(page)).toHaveCount(2);
    await expect(cards(page).nth(0)).toContainText('Lab');
    await expect(cards(page).nth(1)).toContainText('Hex asteroid defense (working title)');
    await expect(cards(page).nth(1)).toContainText('In the works');
    await expect(cards(page).nth(1).getByRole('link')).toHaveCount(0);
  });

  test('search narrows the entries and shows a line when nothing matches', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search thingies' });
    await search.fill('asteroid');
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText('Hex asteroid defense');
    await expect(page.locator('.profile-section-count')).toHaveText('1 of 2 entries');

    await search.fill('no such thingy');
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('Nothing matches that search.');

    await search.fill('');
    await expect(cards(page)).toHaveCount(2);
  });

  test('a tag filter narrows the entries', async ({ page }) => {
    const game = page.getByRole('button', { name: 'Game' });
    await game.click();
    await expect(game).toHaveAttribute('aria-pressed', 'true');
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText('Hex asteroid defense');

    await page.getByRole('button', { name: 'Tool' }).click();
    await expect(cards(page)).toHaveCount(2);

    await game.click();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText('Lab');
  });

  test('the lab entry opens /lab', async ({ page }) => {
    const lab = page.getByRole('link', { name: 'Lab', exact: true });
    await expect(lab).toHaveAttribute('href', '/lab');
    await lab.click();
    await expect(page).toHaveURL(/\/lab$/);
  });
});

test('the menu link opens /thingies', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  if (isMobile) await page.locator('nav button').first().click();
  const link = page.locator('nav').getByRole('link', { name: 'Thingies' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/thingies$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Thingies');
});

import { test, expect } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`cards show their description after normal and rapid flips in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((value) => { localStorage.theme = value; }, theme);
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
    const card = page.locator('.skill-card').first();
    // A working category control confirms hydration before clicking the card.
    const languages = page.getByRole('button', { name: /Languages/ });
    await languages.click();
    await expect(languages).toHaveAttribute('aria-pressed', 'false');
    await languages.click();
    await card.scrollIntoViewIfNeeded();

    const visibleFace = () => card.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + 24);
      return hit?.closest('.back') ? 'back' : hit?.closest('.front') ? 'front' : 'neither';
    });

    await card.click();
    await expect.poll(visibleFace).toBe('back');
    await expect(card.locator('.back')).toContainText('Swift is a general-purpose');
    await page.waitForTimeout(900);
    await expect.poll(visibleFace).toBe('back');

    // Return to the front, then reverse again before the old overflow timer ran.
    await card.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    await page.keyboard.press('Space');
    await page.waitForTimeout(900);
    await expect.poll(visibleFace).toBe('back');

    await page.keyboard.press('Enter');
    await expect.poll(visibleFace).toBe('front');
    const shine = card.locator('.shine');
    await expect(shine).toBeVisible();
    expect(await shine.evaluate((element) => element.getAnimations().some((animation) => animation.playState === 'running'))).toBe(true);
  });
}

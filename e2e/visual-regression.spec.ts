import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'experience', path: '/experience' },
  { name: 'education', path: '/education' },
  { name: 'skills', path: '/skills' },
  { name: 'tools', path: '/tools' },
  { name: 'cats', path: '/cats' },
  { name: 'blog', path: '/blog' },
  { name: 'blog-dr-001', path: '/blog/dr-001' },
];

const MODES = ['light', 'dark'] as const;

for (const page of PAGES) {
  for (const mode of MODES) {
    test(`${page.name} – ${mode}`, async ({ page: p }) => {
      await disableAnimations(p);
      await disableParticles(p);
      await setColorMode(p, mode);
      await p.goto(page.path);
      await p.waitForLoadState('networkidle');
      await removeParticleCanvas(p);
      await p.waitForTimeout(500);

      await expect(p).toHaveScreenshot(`${page.name}-${mode}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.005,
      });
    });
  }
}

async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  });
}

async function disableParticles(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `
      .particle-background, #particles, #particles canvas {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    }
  });
}

async function removeParticleCanvas(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    document.querySelectorAll('#particles canvas').forEach((el) => el.remove());
    const bg = document.querySelector('.particle-background');
    if (bg instanceof HTMLElement) bg.style.display = 'none';
  });
}

async function setColorMode(
  page: import('@playwright/test').Page,
  mode: 'light' | 'dark',
) {
  await page.addInitScript((m) => {
    localStorage.setItem('theme', m);
  }, mode);

  if (mode === 'dark') {
    await page.emulateMedia({ colorScheme: 'dark' });
  } else {
    await page.emulateMedia({ colorScheme: 'light' });
  }
}

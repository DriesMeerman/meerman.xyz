import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { execSync } from 'node:child_process';

const SCREENSHOTS_DIR = join(process.cwd(), 'e2e', 'screenshots');
const BASELINE_DIR = join(SCREENSHOTS_DIR, 'baseline');
const CURRENT_DIR = join(SCREENSHOTS_DIR, 'current');
const DIFFS_DIR = join(SCREENSHOTS_DIR, 'diffs');
const REPORT_PATH = join(process.cwd(), 'e2e', 'report', 'report.json');

interface ReportEntry {
  page: string;
  mode: string;
  viewport: string;
  baseline: string | null;
  current: string | null;
  diff: string | null;
  status: 'unchanged' | 'changed' | 'new' | 'removed';
}

interface Report {
  timestamp: string;
  summary: { total: number; changed: number; unchanged: number; new: number; removed: number };
  entries: ReportEntry[];
}

function parseScreenshotName(filename: string): { page: string; mode: string; viewport: string } | null {
  const name = basename(filename, extname(filename));
  // Format: {page}-{mode}-{project}.png where project encodes viewport
  // Playwright snapshot names: {page}-{mode}-{project}.png
  // Our naming: {page}-{mode}.png and project = desktop-chromium or mobile-chromium
  const match = name.match(/^(.+)-(light|dark)$/);
  if (!match) return null;
  return { page: match[1], mode: match[2], viewport: 'unknown' };
}

async function listPngs(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir, { recursive: true });
    return files.filter((f) => f.endsWith('.png'));
  } catch {
    return [];
  }
}

async function filesEqual(a: string, b: string): Promise<boolean> {
  try {
    const [bufA, bufB] = await Promise.all([readFile(a), readFile(b)]);
    return bufA.equals(bufB);
  } catch {
    return false;
  }
}

async function generateReport(): Promise<void> {
  await mkdir(join(process.cwd(), 'e2e', 'report'), { recursive: true });

  // Playwright stores snapshots in per-project directories under the test snapshots folder
  // e.g., e2e/visual-regression.spec.ts-snapshots/{name}-desktop-chromium.png
  // We scan for all .png files in both baseline and test-results directories
  const snapshotDir = join(process.cwd(), 'e2e', 'visual-regression.spec.ts-snapshots');
  const testResultsDir = join(process.cwd(), 'e2e', 'test-results');

  let snapshotFiles: string[] = [];
  try {
    const files = await readdir(snapshotDir, { recursive: true });
    snapshotFiles = files.filter((f) => f.endsWith('.png'));
  } catch {
    // No snapshots yet
  }

  const entries: ReportEntry[] = [];

  for (const file of snapshotFiles) {
    const name = basename(file, '.png');
    // Parse: {page}-{mode}-{project}.png
    const projectMatch = name.match(/^(.+)-(light|dark)-(desktop-chromium|mobile-chromium)$/);
    if (!projectMatch) continue;

    const page = projectMatch[1];
    const mode = projectMatch[2];
    const viewport = projectMatch[3].startsWith('desktop') ? 'desktop' : 'mobile';

    entries.push({
      page,
      mode,
      viewport,
      baseline: join(snapshotDir, file),
      current: null,
      diff: null,
      status: 'unchanged',
    });
  }

  // Check for actual/diff images in test-results (Playwright puts them there on failure)
  let resultFiles: string[] = [];
  try {
    const files = await readdir(testResultsDir, { recursive: true });
    resultFiles = files.filter((f) => f.endsWith('.png'));
  } catch {
    // No results yet
  }

  for (const resultFile of resultFiles) {
    const name = basename(resultFile, '.png');
    if (name.endsWith('-actual')) {
      const baseName = name.replace(/-actual$/, '');
      const entry = entries.find(
        (e) =>
          `${e.page}-${e.mode}-${e.viewport === 'desktop' ? 'desktop-chromium' : 'mobile-chromium'}` ===
          baseName,
      );
      if (entry) {
        entry.current = join(testResultsDir, resultFile);
        entry.status = 'changed';
      }
    }
    if (name.endsWith('-diff')) {
      const baseName = name.replace(/-diff$/, '');
      const entry = entries.find(
        (e) =>
          `${e.page}-${e.mode}-${e.viewport === 'desktop' ? 'desktop-chromium' : 'mobile-chromium'}` ===
          baseName,
      );
      if (entry) {
        entry.diff = join(testResultsDir, resultFile);
      }
    }
  }

  const summary = {
    total: entries.length,
    changed: entries.filter((e) => e.status === 'changed').length,
    unchanged: entries.filter((e) => e.status === 'unchanged').length,
    new: entries.filter((e) => e.status === 'new').length,
    removed: entries.filter((e) => e.status === 'removed').length,
  };

  const report: Report = {
    timestamp: new Date().toISOString(),
    summary,
    entries,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`Report written to ${REPORT_PATH}`);
  console.log(`  Total: ${summary.total}, Changed: ${summary.changed}, Unchanged: ${summary.unchanged}`);

  if (summary.changed > 0) {
    console.log('\nChanged screenshots:');
    for (const entry of entries.filter((e) => e.status === 'changed')) {
      console.log(`  ${entry.page} (${entry.mode}, ${entry.viewport})`);
    }
  }

  // Open the viewer
  const viewerPath = join(process.cwd(), 'tools', 'report-viewer', 'index.html');
  try {
    if (process.platform === 'darwin') {
      execSync(`open "${viewerPath}"`);
    } else if (process.platform === 'linux') {
      execSync(`xdg-open "${viewerPath}"`);
    }
  } catch {
    console.log(`\nOpen the report viewer at: ${viewerPath}`);
  }
}

generateReport().catch((err) => {
  console.error('Failed to generate report:', err);
  process.exit(1);
});

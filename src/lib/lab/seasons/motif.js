// Deterministic generative glyphs, one per season, seeded by year and season.
// Every function returns SVG path data for a 100 x 100 viewBox, drawn with `stroke: currentColor`.

/** @param {number} seed */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {number} n */
const f = (n) => n.toFixed(1);

/** Branching lines growing up from the bottom. @param {() => number} rnd */
function spring(rnd) {
  /** @type {string[]} */
  const parts = [];
  /** @param {number} x @param {number} y @param {number} angle @param {number} len @param {number} depth */
  const grow = (x, y, angle, len, depth) => {
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    parts.push(`M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}`);
    if (depth === 0) {
      parts.push(`M${f(x2 - 1.2)} ${f(y2)}a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0`);
      return;
    }
    const spread = 0.35 + rnd() * 0.35;
    grow(x2, y2, angle - spread, len * (0.62 + rnd() * 0.16), depth - 1);
    grow(x2, y2, angle + spread, len * (0.62 + rnd() * 0.16), depth - 1);
    if (rnd() > 0.65) grow(x2, y2, angle + (rnd() - 0.5) * 0.3, len * 0.5, depth - 1);
  };
  grow(50, 98, -Math.PI / 2 + (rnd() - 0.5) * 0.2, 26, 4);
  return parts.join('');
}

/** Radial sun: rings and rays of varying length. @param {() => number} rnd */
function summer(rnd) {
  const parts = ['M38 50a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', 'M31 50a19 19 0 1 0 38 0a19 19 0 1 0 -38 0'];
  const rays = 24 + Math.floor(rnd() * 12);
  const twist = rnd() * Math.PI;
  for (let i = 0; i < rays; i++) {
    const a = twist + (i / rays) * Math.PI * 2;
    const inner = 22 + rnd() * 3;
    const outer = inner + 6 + rnd() * (i % 3 === 0 ? 22 : 12);
    parts.push(`M${f(50 + Math.cos(a) * inner)} ${f(50 + Math.sin(a) * inner)}L${f(50 + Math.cos(a) * outer)} ${f(50 + Math.sin(a) * outer)}`);
  }
  return parts.join('');
}

/** Falling leaf arcs over a fractured grid. @param {() => number} rnd */
function autumn(rnd) {
  /** @type {string[]} */
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const x = 14 + i * 24 + (rnd() - 0.5) * 6;
    const y = 30 + i * 12 + rnd() * 20;
    const len = 12 + rnd() * 20;
    parts.push(`M${f(x)} ${f(y)}L${f(x)} ${f(y + len)}M${f(x + (rnd() - 0.5) * 3)} ${f(y + len + 3 + rnd() * 4)}L${f(x)} ${f(y + len * 1.6 + 6)}`);
  }
  const leaves = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < leaves; i++) {
    const x = 12 + rnd() * 76;
    const y = 10 + rnd() * 76;
    const dir = rnd() > 0.5 ? 1 : -1;
    const w = 10 + rnd() * 16;
    parts.push(`M${f(x)} ${f(y)}q${f(dir * w / 2)} ${f(6 + rnd() * 6)} ${f(dir * w)} 0`);
    const a = rnd() * Math.PI;
    const lx = x + dir * w;
    const dx = Math.cos(a) * 3;
    const dy = Math.sin(a) * 3;
    parts.push(`M${f(lx - dx)} ${f(y - dy)}Q${f(lx + dy)} ${f(y - dx)} ${f(lx + dx)} ${f(y + dy)}Q${f(lx - dy)} ${f(y + dx)} ${f(lx - dx)} ${f(y - dy)}`);
  }
  return parts.join('');
}

/** Crystalline lattice: a six-fold snowflake with seeded side branches. @param {() => number} rnd */
function winter(rnd) {
  /** @type {Array<[number, number, number]>} distance along the arm, branch length, branch angle */
  const branches = [];
  const count = 3 + Math.floor(rnd() * 2);
  for (let i = 0; i < count; i++) branches.push([10 + (i / count) * 30 + rnd() * 4, 5 + rnd() * 9, 0.6 + rnd() * 0.5]);
  /** @type {string[]} */
  const parts = ['M50 38L60.4 44L60.4 56L50 62L39.6 56L39.6 44Z'];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
    const ex = 50 + Math.cos(a) * 46;
    const ey = 50 + Math.sin(a) * 46;
    parts.push(`M50 50L${f(ex)} ${f(ey)}`);
    for (const [dist, len, spread] of branches) {
      const bx = 50 + Math.cos(a) * dist;
      const by = 50 + Math.sin(a) * dist;
      for (const s of [-1, 1]) {
        const b = a + s * spread;
        parts.push(`M${f(bx)} ${f(by)}L${f(bx + Math.cos(b) * len)} ${f(by + Math.sin(b) * len)}`);
      }
    }
  }
  return parts.join('');
}

const DRAW = { spring, summer, autumn, winter };

/**
 * @param {import('../time.js').SeasonId} season
 * @param {number} year
 */
export function seasonMotif(season, year) {
  const index = Object.keys(DRAW).indexOf(season);
  return DRAW[season](mulberry32(year * 7919 + index * 104729 + 17));
}

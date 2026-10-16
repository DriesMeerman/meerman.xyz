// Date helpers shared by the lab widgets. All dates use the visitor's local time zone.

const DAY_MS = 86_400_000;

/** @param {Date} date */
export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** @param {number} year */
export function daysInYear(year) {
  return Math.round((new Date(year + 1, 0, 1).getTime() - new Date(year, 0, 1).getTime()) / DAY_MS);
}

/** Day number within the year, 1 for January 1st. @param {Date} date */
export function dayOfYear(date) {
  return Math.round((startOfDay(date).getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / DAY_MS) + 1;
}

/**
 * Fraction of `year` that has passed at `now`, from 0 to 1.
 * Past years stay complete and future years stay empty instead of rolling over.
 * @param {number} year
 * @param {Date} now
 */
export function yearProgress(year, now) {
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}

/** ISO 8601 week number. @param {Date} date */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

/** @param {Date} a @param {Date} b */
export function daysBetween(a, b) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

/** @typedef {'spring' | 'summer' | 'autumn' | 'winter'} SeasonId */

/** Meteorological seasons, in display order. Winter starts in December and runs into the next year. */
export const SEASONS = /** @type {const} */ ([
  { id: 'spring', label: 'Spring', startMonth: 2 },
  { id: 'summer', label: 'Summer', startMonth: 5 },
  { id: 'autumn', label: 'Autumn', startMonth: 8 },
  { id: 'winter', label: 'Winter', startMonth: 11 }
]);

/**
 * The meteorological season containing `date`, with its start and end (end exclusive).
 * January and February belong to the winter that started the previous December.
 * @param {Date} date
 */
export function seasonAt(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const season = month < 2 ? SEASONS[3] : [...SEASONS].reverse().find((s) => month >= s.startMonth) ?? SEASONS[3];
  const startYear = season.id === 'winter' && month < 2 ? year - 1 : year;
  return seasonRange(season.id, startYear);
}

/**
 * @param {SeasonId} id
 * @param {number} startYear year in which the season starts (winter 2026 runs Dec 2026 to Feb 2027)
 */
export function seasonRange(id, startYear) {
  const season = SEASONS.find((s) => s.id === id) ?? SEASONS[0];
  const start = new Date(startYear, season.startMonth, 1);
  const end = new Date(startYear, season.startMonth + 3, 1);
  return { ...season, startYear, start, end };
}

/**
 * Progress through a season range at `now`, clamped to 0..1.
 * @param {{ start: Date, end: Date }} range
 * @param {Date} now
 */
export function rangeProgress(range, now) {
  const span = range.end.getTime() - range.start.getTime();
  return Math.min(1, Math.max(0, (now.getTime() - range.start.getTime()) / span));
}

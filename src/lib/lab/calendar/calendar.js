// Calendar helpers: month grids and the events from `events.json`.
import data from './events.json';
import { isoWeek } from '../time.js';

/** @typedef {'holiday' | 'event' | 'personal'} EventKind */
/** @typedef {{ date: Date, key: string, title: string, kind: EventKind }} CalendarEvent */

const KINDS = ['holiday', 'event', 'personal'];

export const LABELS = {
  nl: {
    months: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
    days: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'],
    week: 'wk',
    events: 'Agenda',
    today: 'vandaag',
    tomorrow: 'morgen',
    /** @param {number} n */
    inDays: (n) => `over ${n} d`,
    passed: 'voorbij',
    none: 'Geen bijzondere dagen',
    more: 'meer',
    kinds: { holiday: 'feestdag', event: 'bijzonder', personal: 'eigen' },
    later: 'Daarna'
  },
  en: {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    week: 'wk',
    events: 'Events',
    today: 'today',
    tomorrow: 'tomorrow',
    /** @param {number} n */
    inDays: (n) => `in ${n} d`,
    passed: 'passed',
    none: 'Nothing special',
    more: 'more',
    kinds: { holiday: 'holiday', event: 'notable', personal: 'personal' },
    later: 'After that'
  }
};

/** @param {Date} date */
export function dateKey(date) {
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Parses `YYYY-MM` into the first day of that month, or null.
 * @param {string} value
 */
export function parseMonth(value) {
  const match = value.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Number(match[1]), month - 1, 1);
}

/**
 * Six Monday-first weeks covering the month, with ISO week numbers.
 * @param {number} year
 * @param {number} month zero based
 */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  /** @type {{ week: number, days: { date: Date, key: string, inMonth: boolean, weekend: boolean }[] }[]} */
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(year, month, 1 - offset + w * 7 + d);
      days.push({ date, key: dateKey(date), inMonth: date.getMonth() === month, weekend: d >= 5 });
    }
    weeks.push({ week: isoWeek(days[0].date), days });
  }
  return weeks;
}

/**
 * Events between `from` and `to` (both inclusive, local days), sorted by date.
 * Recurring entries (`month` + `day`) are repeated for every year in the range.
 * @param {Date} from
 * @param {Date} to
 * @returns {CalendarEvent[]}
 */
export function eventsBetween(from, to) {
  const start = dateKey(from);
  const end = dateKey(to);
  /** @type {CalendarEvent[]} */
  const found = [];
  for (const entry of /** @type {Record<string, unknown>[]} */ (data.events)) {
    const title = typeof entry.title === 'string' ? entry.title : '';
    const kind = /** @type {EventKind} */ (KINDS.includes(String(entry.kind)) ? entry.kind : 'event');
    if (!title) continue;
    /** @type {Date[]} */
    const dates = [];
    if (typeof entry.date === 'string') {
      const match = entry.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) dates.push(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    } else if (typeof entry.month === 'number' && typeof entry.day === 'number') {
      for (let year = from.getFullYear(); year <= to.getFullYear(); year++) dates.push(new Date(year, entry.month - 1, entry.day));
    }
    for (const date of dates) {
      const key = dateKey(date);
      if (key >= start && key <= end) found.push({ date, key, title, kind });
    }
  }
  const rank = (/** @type {EventKind} */ kind) => KINDS.indexOf(kind);
  return found.sort((a, b) => a.key.localeCompare(b.key) || rank(a.kind) - rank(b.kind));
}

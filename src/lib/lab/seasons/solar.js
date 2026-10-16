// Compact solar maths for the seasons widget, no dependencies.
// Sunrise and sunset use the NOAA general solar position approximation (accurate to a minute or two).
// Equinoxes and solstices use Meeus' mean formulas, which land within about a day of the real moment.

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;

/**
 * Sunrise, sunset and day length on the calendar day of `date` (local time zone) at `lat`/`lon`.
 * `rise`/`set` are null during polar day or polar night; `dayMinutes` is then 1440 or 0.
 * @param {Date} date
 * @param {number} lat degrees, north positive
 * @param {number} lon degrees, east positive
 */
export function sunTimes(date, lat, lon) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const n = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / DAY_MS);
  const g = (2 * Math.PI / (isLeap(y) ? 366 : 365)) * n;
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosHa = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl);
  if (cosHa > 1) return { rise: null, set: null, dayMinutes: 0 };
  if (cosHa < -1) return { rise: null, set: null, dayMinutes: 1440 };
  const ha = Math.acos(cosHa) / RAD;
  const dayUtc = Date.UTC(y, m, d);
  const riseMin = 720 - 4 * (lon + ha) - eqTime;
  const setMin = 720 - 4 * (lon - ha) - eqTime;
  return {
    rise: new Date(dayUtc + riseMin * 60_000),
    set: new Date(dayUtc + setMin * 60_000),
    dayMinutes: setMin - riseMin
  };
}

/** @param {number} year */
function isLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Mean equinox and solstice terms (Meeus, Astronomical Algorithms, table 27.b, years 2000 to 3000). */
const TERMS = {
  march: [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
  june: [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.0003],
  september: [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
  december: [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032]
};

/**
 * Approximate moment of an equinox or solstice.
 * @param {keyof typeof TERMS} which
 * @param {number} year
 */
export function solarEvent(which, year) {
  const t = (year - 2000) / 1000;
  const [a, b, c, d, e] = TERMS[which];
  const jde = a + b * t + c * t ** 2 + d * t ** 3 + e * t ** 4;
  return new Date((jde - 2440587.5) * DAY_MS);
}

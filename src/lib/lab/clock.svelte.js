// Live clock for the lab. It follows the computer date unless a fixed date is passed (`?date=YYYY-MM-DD`).

/** @param {string | null} value */
export function parseDateOverride(value) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class LabClock {
  now = $state(new Date());
  fixed = false;

  /** @param {Date | null} [override] */
  constructor(override = null) {
    if (override) {
      this.now = override;
      this.fixed = true;
    }
  }

  /** Starts ticking and returns a stop function. Re-syncs when a sleeping laptop or hidden tab wakes up. */
  start(intervalMs = 1000) {
    if (this.fixed) return () => {};
    const tick = () => (this.now = new Date());
    const timer = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }
}

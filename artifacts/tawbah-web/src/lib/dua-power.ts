// ── Dua-answer power score calculation ────────────────────────────────────────
// Mirrors the window definitions in dua-timing.tsx.
// Returns a score 0-100 representing how powerful the current moment is for dua.

function getHour(): number { return new Date().getHours(); }
function getDayOfWeek(): number { return new Date().getDay(); }

function isLastThirdOfNight(): boolean {
  const h = getHour(); return h >= 2 && h <= 5;
}
function isFajrTime(): boolean {
  const h = getHour(); return h >= 4 && h <= 5;
}
function isMorningDhikrTime(): boolean {
  const h = getHour(); return h >= 5 && h <= 7;
}
function isEveningDhikrTime(): boolean {
  const h = getHour(); return h >= 17 && h <= 19;
}
function isFriday(): boolean { return getDayOfWeek() === 5; }
function isFridayAnswerHour(): boolean {
  const h = getHour(); return isFriday() && h >= 15 && h <= 17;
}
function isBetweenAdhanIqamah(): boolean {
  const h = getHour();
  const m = new Date().getMinutes();
  return (
    (h === 5  && m >= 0 && m <= 20) ||
    (h === 12 && m >= 0 && m <= 20) ||
    (h === 15 && m >= 30 && m <= 50) ||
    (h === 18 && m >= 0 && m <= 20) ||
    (h === 19 && m >= 30 && m <= 50)
  );
}
function isMonThur(): boolean {
  const d = getDayOfWeek(); return d === 1 || d === 4;
}

function getHijriDayMonth(): { day: number; month: number } {
  const now = new Date();
  const jd = Math.floor(now.getTime() / 86400000 + 2440587.5);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  return {
    day: Math.floor((24 * l3) / 709),
    month: Math.floor(l3 / 29.5001) + 1,
  };
}

function isArafahDay(): boolean {
  const { day, month } = getHijriDayMonth();
  return month === 12 && day === 9;
}
function isRamadan(): boolean {
  return getHijriDayMonth().month === 9;
}

interface Window { power: number; active: boolean }

function buildWindows(): Window[] {
  return [
    { power: 40, active: isLastThirdOfNight() },
    { power: 45, active: isFridayAnswerHour() },
    { power: 35, active: isBetweenAdhanIqamah() },
    { power: 30, active: isFajrTime() },
    { power: 25, active: isMorningDhikrTime() },
    { power: 25, active: isEveningDhikrTime() },
    { power: 20, active: isMonThur() },
    { power: 50, active: isArafahDay() },
    { power: 30, active: isRamadan() },
    { power: 35, active: true }, // sujood — always contributing
  ];
}

/** Returns 0-100 power score for the current moment. */
export function calcDuaPower(): number {
  const wins = buildWindows();
  const active = wins.filter((w) => w.active);
  if (active.length === 0) return 12;
  const total = active.reduce((s, w) => s + w.power, 0);
  return Math.min(100, total);
}

// ── Cooldown helpers ──────────────────────────────────────────────────────────

const COOLDOWN_KEY = "dua_peak_last_fired";
const COOLDOWN_MS  = 2 * 60 * 60 * 1000; // 2 hours

export function duaPeakCooledDown(): boolean {
  const raw = localStorage.getItem(COOLDOWN_KEY);
  if (!raw) return true;
  return Date.now() - parseInt(raw, 10) > COOLDOWN_MS;
}

export function markDuaPeakFired(): void {
  localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
}

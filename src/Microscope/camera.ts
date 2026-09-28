import { TARGET_ACINUS, TARGET_ISLET } from "./pancreas";

/** Lens geometry (px) inside the 1080×1920 frame. */
export const LENS_R = 410;

/** px per world unit at the overview (4x) and the two zoom stops. */
export const S4 = LENS_R / 2750;

type Key = { f: number; x: number; y: number; mag: number };

const T = TARGET_ISLET;
// Frame the islet and the acinus cluster together at 40x.
const C40 = { x: (T.x + TARGET_ACINUS.x) / 2, y: (T.y + TARGET_ACINUS.y) / 2 };

// Global frames (30 fps). 0:07 zoom starts, 4x → 10x, a pan at 10x, → 40x by ~0:12.6.
const KEYS: Key[] = [
  { f: 0, x: 0, y: 0, mag: 4 },
  { f: 210, x: 0, y: 0, mag: 4 },
  { f: 262, x: T.x - 650, y: T.y + 520, mag: 10 },
  { f: 318, x: T.x + 260, y: T.y - 260, mag: 11.5 },
  { f: 378, x: C40.x, y: C40.y, mag: 40 },
  { f: 540, x: C40.x + 18, y: C40.y - 12, mag: 41 },
  { f: 660, x: C40.x + 40, y: C40.y - 24, mag: 42 },
  { f: 750, x: C40.x + 40, y: C40.y - 24, mag: 42 },
];

/** Monotone cubic Hermite interpolation (Fritsch–Carlson): smooth, no overshoot. */
const monotone = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const hs = xs.slice(0, -1).map((x, i) => xs[i + 1] - x);
  const m = xs.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    if (d[i - 1] * d[i] <= 0) return 0;
    const h0 = hs[i - 1];
    const h1 = hs[i];
    return (3 * (h0 + h1)) / ((2 * h1 + h0) / d[i - 1] + (h1 + 2 * h0) / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
};

const fs = KEYS.map((k) => k.f);
const cx = monotone(fs, KEYS.map((k) => k.x));
const cy = monotone(fs, KEYS.map((k) => k.y));
const logMag = monotone(fs, KEYS.map((k) => Math.log(k.mag)));

export const camera = (frame: number) => {
  const mag = Math.exp(logMag(frame));
  return { x: cx(frame), y: cy(frame), mag, s: (mag / 4) * S4 };
};

export const STOPS = [4, 10, 40] as const;
export const stopFor = (mag: number) => (mag < 9.5 ? 4 : mag < 38 ? 10 : 40);

/** Frames at which the badge switches stop — used to pop the badge. */
export const STOP_CHANGES: number[] = (() => {
  const out: number[] = [];
  let prev = stopFor(camera(0).mag);
  for (let f = 1; f < 750; f++) {
    const s = stopFor(camera(f).mag);
    if (s !== prev) out.push(f);
    prev = s;
  }
  return out;
})();

/** World → lens-local screen px (origin at the lens centre). */
export const toLens = (frame: number, wx: number, wy: number) => {
  const c = camera(frame);
  return { x: (wx - c.x) * c.s, y: (wy - c.y) * c.s };
};

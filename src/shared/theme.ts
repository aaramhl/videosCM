import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 15 * FPS;

export const colors = {
  navy900: "#0F2438",
  navy950: "#0A1A2A",
  blue700: "#0B3474",
  turquoise600: "#0D7D88",
  // Lighter tints of Turquoise 600, used only for glows and thin highlights.
  turquoiseGlow: "#3FC2CC",
  turquoiseSoft: "#8FE0E6",
  text: "#EAF2F6",
  textMuted: "#9FB3C4",
  mutedIcon: "#56697F",
  cardFill: "rgba(11, 52, 116, 0.38)",
  cardBorder: "rgba(63, 194, 204, 0.32)",
  // H&E tones
  heBackground: "#F8E4EC",
  heCytoplasm: "#F1BBCF",
  heCytoplasmStroke: "#D98CAF",
  heStroma: "#E7A6C1",
  heNucleus: "#5B3A92",
  heNucleusStroke: "#3F2468",
  heChromatin: "#8C69C2",
};

export const fonts = {
  arabic: "'Cairo Variable', 'Cairo', sans-serif",
  latin: "'Inter Variable', 'Inter', sans-serif",
};

export const radius = { card: 22, pill: 999 };

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

/** Clamped interpolate with an easing curve. */
export const tween = (
  frame: number,
  [start, end]: [number, number],
  [from, to]: [number, number],
  easing: (t: number) => number = easeOut,
) =>
  interpolate(frame, [start, end], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Mix two #RRGGBB colours. */
export const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

/** Closed Catmull-Rom spline through points, as an SVG path. */
export const smoothClosedPath = (pts: [number, number][]) => {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
};

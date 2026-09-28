/**
 * Procedural, stylised H&E pancreas section.
 *
 * World units are roughly micrometres. The whole section is generated once at
 * module load; drawing is batched into a few large paths per spatial chunk so
 * the viewer can cull everything outside the current field of view.
 */
import { smoothClosedPath } from "../shared/theme";

export const he = {
  glass: "#F6F0F3",
  stroma: "#F3D6E2",
  acinusBase: "#D89AC3", // basophilic basal cytoplasm
  acinusApical: "#F2B5CC", // eosinophilic zymogen granules
  acinusStroke: "#B97AA8",
  border: "#C28AB5",
  lumen: "#F8E6EE",
  nucleus: "#4B2C82",
  isletFill: "#EDCBDD",
  isletStroke: "#D2A0C0",
  isletNucleus: "#6D52A8",
  capillary: "#D8768F",
  rbc: "#D34C66",
  ductEpithelium: "#EDB6CC",
  fiber: "#E7A9C3",
};

// Deterministic PRNG (mulberry32).
const makeRng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rng = makeRng(20260928);
const rand = (a = 0, b = 1) => a + (b - a) * rng();

const f1 = (n: number) => n.toFixed(1);

// ---------------------------------------------------------------- organ outline
const ORGAN_RX = 2050;
const ORGAN_RY = 2350;
const organRadius = (theta: number) => {
  const base =
    (ORGAN_RX * ORGAN_RY) /
    Math.sqrt((ORGAN_RY * Math.cos(theta)) ** 2 + (ORGAN_RX * Math.sin(theta)) ** 2);
  return base * (1 + 0.07 * Math.sin(3 * theta + 1) + 0.05 * Math.sin(5 * theta + 2.2) + 0.025 * Math.sin(11 * theta + 0.4));
};
const insideOrgan = (x: number, y: number, margin = 0) =>
  Math.hypot(x, y) < organRadius(Math.atan2(y, x)) - margin;

export const ORGAN_PATH = smoothClosedPath(
  new Array(90).fill(0).map((_, i) => {
    const th = (i / 90) * Math.PI * 2;
    const r = organRadius(th) + 40;
    return [Math.cos(th) * r, Math.sin(th) * r];
  }),
);
export const ORGAN_EXTENT = 2700; // radius that comfortably contains the section

// ---------------------------------------------------------------- lobules
// Poisson-disc style sampling gives irregular, organic lobules.
export const LOBULES: [number, number][] = [];
for (let tries = 0; tries < 6000 && LOBULES.length < 90; tries++) {
  const px = rand(-2400, 2400);
  const py = rand(-2700, 2700);
  if (!insideOrgan(px, py, 100)) continue;
  if (LOBULES.some(([lx, ly]) => Math.hypot(px - lx, py - ly) < 470)) continue;
  LOBULES.push([px, py]);
}
const septumGap = (x: number, y: number) => {
  let d1 = Infinity;
  let d2 = Infinity;
  for (const [lx, ly] of LOBULES) {
    const d = Math.hypot(x - lx, y - ly);
    if (d < d1) {
      d2 = d1;
      d1 = d;
    } else if (d < d2) d2 = d;
  }
  return d2 - d1;
};

const nearestLobule = (x: number, y: number) =>
  LOBULES.reduce((best, l) => (Math.hypot(l[0] - x, l[1] - y) < Math.hypot(best[0] - x, best[1] - y) ? l : best));

// ---------------------------------------------------------------- islets
export type Islet = { x: number; y: number; r: number; fill: string; nuclei: string; capillaries: string; rbcs: string };

const circlePath = (x: number, y: number, r: number) =>
  `M ${f1(x - r)} ${f1(y)} a ${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0 a ${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0 `;

const ellipsePath = (x: number, y: number, rx: number, ry: number, rotRad: number) => {
  const ux = Math.cos(rotRad) * rx;
  const uy = Math.sin(rotRad) * rx;
  const deg = f1((rotRad * 180) / Math.PI);
  return `M ${f1(x - ux)} ${f1(y - uy)} a ${f1(rx)} ${f1(ry)} ${deg} 1 0 ${f1(2 * ux)} ${f1(2 * uy)} a ${f1(rx)} ${f1(ry)} ${deg} 1 0 ${f1(-2 * ux)} ${f1(-2 * uy)} `;
};

const makeIslet = (x: number, y: number, r: number): Islet => {
  const fill = smoothClosedPath(
    new Array(16).fill(0).map((_, i) => {
      const th = (i / 16) * Math.PI * 2;
      const rr = r * rand(0.92, 1.06);
      return [x + Math.cos(th) * rr, y + Math.sin(th) * rr];
    }),
  );
  let nuclei = "";
  const sp = 17;
  for (let gy = -r; gy <= r; gy += sp * 0.87) {
    for (let gx = -r; gx <= r; gx += sp) {
      const nx = gx + (Math.round(gy / sp) % 2 ? sp / 2 : 0) + rand(-4, 4);
      const ny = gy + rand(-4, 4);
      if (Math.hypot(nx, ny) > r * 0.9 || rng() < 0.1) continue;
      nuclei += circlePath(x + nx, y + ny, rand(3.6, 4.8));
    }
  }
  let capillaries = "";
  let rbcs = "";
  for (let c = 0; c < 3; c++) {
    const th = rand(0, Math.PI);
    const off = rand(-0.45, 0.45) * r;
    const pts: [number, number][] = [];
    for (let k = -1; k <= 1.001; k += 0.25) {
      const along = k * r * 0.85;
      const wob = Math.sin(k * 5 + c) * 12;
      pts.push([
        x + Math.cos(th) * along - Math.sin(th) * (off + wob),
        y + Math.sin(th) * along + Math.cos(th) * (off + wob),
      ]);
    }
    capillaries += `M ${pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(" L ")} `;
    pts.slice(1, -1).forEach((p, i) => {
      if (i % 2 === 0) rbcs += circlePath(p[0], p[1], 3.2);
    });
  }
  return { x, y, r, fill, nuclei, capillaries, rbcs };
};

// The islet the demo zooms into, placed well inside a lobule near the centre.
const targetLobule = nearestLobule(420, -380);
export const TARGET_ISLET = makeIslet(targetLobule[0] + 30, targetLobule[1] - 20, 108);
export const ISLETS: Islet[] = [TARGET_ISLET];
for (let i = 0; i < 40 && ISLETS.length < 9; i++) {
  const [lx, ly] = LOBULES[Math.floor(rng() * LOBULES.length)];
  const x = lx + rand(-120, 120);
  const y = ly + rand(-120, 120);
  const r = rand(70, 120);
  if (!insideOrgan(x, y, 250)) continue;
  if (ISLETS.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 400)) continue;
  ISLETS.push(makeIslet(x, y, r));
}

// ---------------------------------------------------------------- duct + vessel (in septa)
export type Tube = { x: number; y: number; outer: string; wall: string; lumen: string; nuclei: string; fibers: string; rbcs: string; exclude: number };

const makeTube = (x: number, y: number, rOuter: number, rLumen: number, kind: "duct" | "vessel"): Tube => {
  const ring = (r: number, jit: number) =>
    smoothClosedPath(
      new Array(14).fill(0).map((_, i) => {
        const th = (i / 14) * Math.PI * 2;
        const rr = r * rand(1 - jit, 1 + jit);
        return [x + Math.cos(th) * rr, y + Math.sin(th) * rr];
      }),
    );
  let nuclei = "";
  const n = kind === "duct" ? 18 : 12;
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
    const rr = kind === "duct" ? (rLumen + rOuter) / 2 : rLumen + 5;
    nuclei +=
      kind === "duct"
        ? ellipsePath(x + Math.cos(th) * rr, y + Math.sin(th) * rr, 4.6, 4, th)
        : ellipsePath(x + Math.cos(th) * rr, y + Math.sin(th) * rr, 6.5, 2.4, th + Math.PI / 2);
  }
  let fibers = "";
  for (let i = 0; i < 7; i++) {
    const r = rOuter + 12 + i * 7;
    const a0 = rand(0, 6.28);
    const a1 = a0 + rand(1.2, 2.6);
    fibers += `M ${f1(x + Math.cos(a0) * r)} ${f1(y + Math.sin(a0) * r)} A ${f1(r)} ${f1(r)} 0 0 1 ${f1(x + Math.cos(a1) * r)} ${f1(y + Math.sin(a1) * r)} `;
  }
  let rbcs = "";
  if (kind === "vessel") {
    for (let i = 0; i < 26; i++) {
      const a = rand(0, 6.28);
      const d = Math.sqrt(rng()) * (rLumen - 6);
      rbcs += circlePath(x + Math.cos(a) * d, y + Math.sin(a) * d, 3.4);
    }
  }
  return {
    x,
    y,
    outer: ring(rOuter + 60, 0.08),
    wall: ring(rOuter, 0.04),
    lumen: ring(rLumen, kind === "duct" ? 0.06 : 0.1),
    nuclei,
    fibers,
    rbcs,
    exclude: rOuter + 70,
  };
};

// Put a duct in the septum next to the target lobule.
const neighbour = LOBULES.filter((l) => l !== targetLobule).reduce((best, l) =>
  Math.hypot(l[0] - targetLobule[0], l[1] - targetLobule[1]) < Math.hypot(best[0] - targetLobule[0], best[1] - targetLobule[1]) ? l : best,
);
export const TUBES: Tube[] = [
  makeTube((targetLobule[0] + neighbour[0]) / 2, (targetLobule[1] + neighbour[1]) / 2, 50, 26, "duct"),
  makeTube(-900, 900, 70, 52, "vessel"),
  makeTube(1100, 1300, 42, 22, "duct"),
];

// ---------------------------------------------------------------- acini, chunked
export const CHUNK = 450;
export type Chunk = {
  x0: number;
  y0: number;
  base: string;
  apical: string;
  borders: string;
  lumens: string;
  nuclei: string;
};
export type Acinus = { x: number; y: number; r: number };

const chunkMap = new Map<string, Chunk>();
export const ACINI: Acinus[] = [];
const SP = 60;
for (let gy = -ORGAN_EXTENT; gy <= ORGAN_EXTENT; gy += SP * 0.87) {
  const row = Math.round(gy / (SP * 0.87));
  for (let gx = -ORGAN_EXTENT; gx <= ORGAN_EXTENT; gx += SP) {
    const x = gx + (row % 2 ? SP / 2 : 0) + rand(-13, 13);
    const y = gy + rand(-13, 13);
    if (!insideOrgan(x, y, 30)) continue;
    if (septumGap(x, y) < 40 + 16 * Math.sin(x / 170 + Math.cos(y / 140) * 2)) continue;
    if (ISLETS.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + 26)) continue;
    if (TUBES.some((t) => Math.hypot(t.x - x, t.y - y) < t.exclude)) continue;
    if (rng() < 0.03) continue;
    const r = rand(25, 31);
    ACINI.push({ x, y, r });

    const key = `${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`;
    let c = chunkMap.get(key);
    if (!c) {
      c = { x0: Math.floor(x / CHUNK) * CHUNK, y0: Math.floor(y / CHUNK) * CHUNK, base: "", apical: "", borders: "", lumens: "", nuclei: "" };
      chunkMap.set(key, c);
    }
    c.base +=
      smoothClosedPath(
        new Array(7).fill(0).map((_, k) => {
          const th = (k / 7) * Math.PI * 2;
          const rr = r * rand(0.88, 1.08);
          return [x + Math.cos(th) * rr, y + Math.sin(th) * rr];
        }),
      ) + " ";
    const lx = x + rand(-3, 3);
    const ly = y + rand(-3, 3);
    c.apical += circlePath(lx, ly, r * rand(0.4, 0.48));
    c.lumens += circlePath(lx, ly, rand(2, 3.2));
    const n = 6 + Math.floor(rng() * 3);
    const a0 = rand(0, 6.28);
    for (let k = 0; k < n; k++) {
      const th = a0 + (k / n) * Math.PI * 2;
      const nr = r * rand(0.66, 0.74);
      c.nuclei += ellipsePath(x + Math.cos(th) * nr, y + Math.sin(th) * nr, rand(4.2, 5), rand(3.3, 3.9), th);
      const tb = th + Math.PI / n;
      c.borders += `M ${f1(lx + Math.cos(tb) * r * 0.24)} ${f1(ly + Math.sin(tb) * r * 0.24)} L ${f1(x + Math.cos(tb) * r * 0.93)} ${f1(y + Math.sin(tb) * r * 0.93)} `;
    }
  }
}
export const CHUNKS = [...chunkMap.values()];

// Acinus cluster used for the "Pancreatic acini" marker: just outside the
// target islet, towards the lower left.
const acinusTarget = {
  x: TARGET_ISLET.x - 0.62 * 265,
  y: TARGET_ISLET.y + 0.78 * 265,
};
export const TARGET_ACINUS = ACINI.reduce((best, a) =>
  Math.hypot(a.x - acinusTarget.x, a.y - acinusTarget.y) < Math.hypot(best.x - acinusTarget.x, best.y - acinusTarget.y) ? a : best,
);

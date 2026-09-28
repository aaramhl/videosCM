import React from "react";
import { random } from "remotion";
import { colors, smoothClosedPath } from "../shared/theme";

type Cell = { d: string; nx: number; ny: number; nrx: number; nry: number; nrot: number; dots: [number, number, number][] };

const GLANDS: [number, number, number, number][] = [
  // cx, cy, outer radius, cell count
  [-200, -170, 205, 14],
  [215, 115, 180, 12],
  [-120, 305, 145, 10],
  [250, -340, 150, 11],
  [-420, 90, 130, 9],
];

const chromatin = (seed: string, rx: number, ry: number): [number, number, number][] =>
  new Array(3).fill(0).map((_, k) => [
    (random(`${seed}cx${k}`) - 0.5) * rx,
    (random(`${seed}cy${k}`) - 0.5) * ry,
    1.6 + random(`${seed}cr${k}`) * 1.8,
  ]);

const glandCells = (): { lumens: string[]; cells: Cell[] } => {
  const lumens: string[] = [];
  const cells: Cell[] = [];
  GLANDS.forEach(([cx, cy, R, n], g) => {
    const rl = R * 0.34;
    lumens.push(
      smoothClosedPath(
        new Array(12).fill(0).map((_, k) => {
          const a = (k / 12) * Math.PI * 2;
          const rr = rl * (0.92 + random(`lu${g}${k}`) * 0.16);
          return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
        }),
      ),
    );
    for (let i = 0; i < n; i++) {
      const seed = `g${g}c${i}`;
      const span = (Math.PI * 2) / n;
      const a0 = i * span + span * 0.05;
      const a1 = (i + 1) * span - span * 0.05;
      const jit = (k: number) => 1 + (random(`${seed}j${k}`) - 0.5) * 0.08;
      const inner = rl + 6;
      const outer = R * (0.95 + random(`${seed}o`) * 0.08);
      const pts: [number, number][] = [];
      [0, 0.5, 1].forEach((t, k) => {
        const a = a0 + (a1 - a0) * t;
        pts.push([cx + Math.cos(a) * inner * jit(k), cy + Math.sin(a) * inner * jit(k)]);
      });
      [1, 0.66, 0.33, 0].forEach((t, k) => {
        const a = a0 + (a1 - a0) * t;
        pts.push([cx + Math.cos(a) * outer * jit(k + 3), cy + Math.sin(a) * outer * jit(k + 3)]);
      });
      const am = (a0 + a1) / 2;
      const nr = inner + (outer - inner) * 0.7;
      const nrx = R * 0.1;
      const nry = R * 0.075;
      cells.push({
        d: smoothClosedPath(pts),
        nx: cx + Math.cos(am) * nr,
        ny: cy + Math.sin(am) * nr,
        nrx,
        nry,
        nrot: (am * 180) / Math.PI,
        dots: chromatin(seed, nrx, nry),
      });
    }
  });
  return { lumens, cells };
};

const looseCells = (spacing: number, rMin: number, rMax: number, avoidGlands: boolean, key: string): Cell[] => {
  const cells: Cell[] = [];
  const ext = 760;
  for (let gy = -ext; gy <= ext; gy += spacing * 0.87) {
    const row = Math.round(gy / spacing);
    for (let gx = -ext; gx <= ext; gx += spacing) {
      const seed = `${key}${gx}_${gy}`;
      const x = gx + (row % 2 ? spacing / 2 : 0) + (random(`${seed}x`) - 0.5) * spacing * 0.35;
      const y = gy + (random(`${seed}y`) - 0.5) * spacing * 0.35;
      if (avoidGlands && GLANDS.some(([cx, cy, R]) => Math.hypot(x - cx, y - cy) < R + spacing * 0.45)) continue;
      if (random(`${seed}skip`) < 0.12) continue;
      const r = rMin + random(`${seed}r`) * (rMax - rMin);
      const pts = new Array(9).fill(0).map((_, k) => {
        const a = (k / 9) * Math.PI * 2;
        const rr = r * (0.85 + random(`${seed}p${k}`) * 0.3);
        return [x + Math.cos(a) * rr, y + Math.sin(a) * rr] as [number, number];
      });
      const nrx = r * (0.36 + random(`${seed}nx`) * 0.08);
      const nry = r * (0.28 + random(`${seed}ny`) * 0.08);
      cells.push({
        d: smoothClosedPath(pts),
        nx: x + (random(`${seed}ox`) - 0.5) * r * 0.3,
        ny: y + (random(`${seed}oy`) - 0.5) * r * 0.3,
        nrx,
        nry,
        nrot: random(`${seed}rot`) * 180,
        dots: chromatin(seed, nrx, nry),
      });
    }
  }
  return cells;
};

const FIBERS = new Array(22).fill(0).map((_, i) => {
  const y0 = -760 + i * 72 + random(`fy${i}`) * 30;
  const amp = 18 + random(`fa${i}`) * 26;
  const ph = random(`fp${i}`) * 6.28;
  let d = `M -780 ${y0}`;
  for (let x = -780; x <= 780; x += 60) {
    d += ` L ${x} ${(y0 + Math.sin(x / 90 + ph) * amp + x * 0.08).toFixed(1)}`;
  }
  return d;
});

const GLAND = glandCells();
const LOOSE = looseCells(96, 36, 46, true, "fg");
const BACK = looseCells(62, 20, 27, false, "bg");

const Cells: React.FC<{ cells: Cell[]; strokeWidth: number }> = ({ cells, strokeWidth }) => (
  <>
    {cells.map((c, i) => (
      <path key={`c${i}`} d={c.d} fill={colors.heCytoplasm} stroke={colors.heCytoplasmStroke} strokeWidth={strokeWidth} />
    ))}
    {cells.map((c, i) => (
      <g key={`n${i}`} transform={`translate(${c.nx.toFixed(1)} ${c.ny.toFixed(1)}) rotate(${c.nrot.toFixed(1)})`}>
        <ellipse rx={c.nrx} ry={c.nry} fill={colors.heNucleus} stroke={colors.heNucleusStroke} strokeWidth={strokeWidth} />
        {c.dots.map(([x, y, r], k) => (
          <circle key={k} cx={x} cy={y} r={r} fill={colors.heChromatin} />
        ))}
      </g>
    ))}
  </>
);

export const TISSUE_EXTENT = 1560;

/** Back layer: fibres and small, softer cells. */
export const TissueBack: React.FC = () => (
  <g>
    {FIBERS.map((d, i) => (
      <path key={i} d={d} fill="none" stroke={colors.heStroma} strokeWidth={3} opacity={0.55} strokeLinecap="round" />
    ))}
    <g opacity={0.45}>
      <Cells cells={BACK} strokeWidth={1.5} />
    </g>
  </g>
);

/** Front layer: glands around lumens plus loose cells. */
export const TissueFront: React.FC = () => (
  <g>
    {GLAND.lumens.map((d, i) => (
      <path key={i} d={d} fill={colors.heBackground} stroke={colors.heCytoplasmStroke} strokeWidth={2} opacity={0.9} />
    ))}
    <Cells cells={GLAND.cells} strokeWidth={2.2} />
    <Cells cells={LOOSE} strokeWidth={2.2} />
  </g>
);

const FLOATERS = new Array(7).fill(0).map((_, i) => ({
  x: (random(`flx${i}`) - 0.5) * 1100,
  y: (random(`fly${i}`) - 0.5) * 1100,
  r: 26 + random(`flr${i}`) * 26,
}));

/**
 * Out-of-focus nuclei drifting in front — the nearest parallax plane.
 * Softness comes from a radial gradient rather than a blur filter, which
 * breaks down when this layer is scaled up during the zoom.
 */
export const TissueFloaters: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="floaterGrad">
        <stop offset="0" stopColor={colors.heNucleus} stopOpacity={0.28} />
        <stop offset="0.55" stopColor={colors.heNucleus} stopOpacity={0.16} />
        <stop offset="1" stopColor={colors.heNucleus} stopOpacity={0} />
      </radialGradient>
    </defs>
    {FLOATERS.map((f, i) => (
      <ellipse key={i} cx={f.x} cy={f.y} rx={f.r * 1.6} ry={f.r * 1.3} fill="url(#floaterGrad)" />
    ))}
  </g>
);

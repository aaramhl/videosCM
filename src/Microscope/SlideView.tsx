import React from "react";
import { useCurrentFrame } from "remotion";
import { camera, LENS_R } from "./camera";
import { CHUNK, CHUNKS, he, ISLETS, ORGAN_PATH, TUBES } from "./pancreas";

/** The tissue under the lens for the current camera. Lens-sized, unclipped. */
export const SlideView: React.FC = () => {
  const frame = useCurrentFrame();
  const c = camera(frame);
  const half = LENS_R / c.s;
  const x0 = c.x - half;
  const y0 = c.y - half;
  const x1 = c.x + half;
  const y1 = c.y + half;
  const visible = (x: number, y: number, r: number) => x + r > x0 && x - r < x1 && y + r > y0 && y - r < y1;

  return (
    <svg width={LENS_R * 2} height={LENS_R * 2} viewBox={`${x0} ${y0} ${half * 2} ${half * 2}`} style={{ display: "block" }}>
      <rect x={x0} y={y0} width={half * 2} height={half * 2} fill={he.glass} />
      <path d={ORGAN_PATH} fill={he.stroma} />
      {TUBES.filter((t) => visible(t.x, t.y, t.exclude + 60)).map((t, i) => (
        <g key={`t${i}`}>
          <path d={t.outer} fill="#F5DCE6" />
          <path d={t.fibers} fill="none" stroke={he.fiber} strokeWidth={2} strokeLinecap="round" />
          <path d={t.wall} fill={he.ductEpithelium} stroke={he.acinusStroke} strokeWidth={1.2} />
          <path d={t.lumen} fill={he.lumen} stroke={he.acinusStroke} strokeWidth={1} />
          <path d={t.nuclei} fill={he.nucleus} />
          {t.rbcs && <path d={t.rbcs} fill={he.rbc} />}
        </g>
      ))}
      {CHUNKS.filter((ch) => ch.x0 + CHUNK + 40 > x0 && ch.x0 - 40 < x1 && ch.y0 + CHUNK + 40 > y0 && ch.y0 - 40 < y1).map((ch) => (
        <g key={`${ch.x0},${ch.y0}`}>
          <path d={ch.base} fill={he.acinusBase} stroke={he.acinusStroke} strokeWidth={1.1} />
          <path d={ch.apical} fill={he.acinusApical} />
          <path d={ch.borders} stroke={he.border} strokeWidth={0.9} fill="none" />
          <path d={ch.lumens} fill={he.lumen} />
          <path d={ch.nuclei} fill={he.nucleus} />
        </g>
      ))}
      {ISLETS.filter((o) => visible(o.x, o.y, o.r + 20)).map((o, i) => (
        <g key={`i${i}`}>
          <path d={o.fill} fill={he.isletFill} stroke={he.isletStroke} strokeWidth={1.5} />
          <path d={o.capillaries} fill="none" stroke={he.capillary} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
          <path d={o.rbcs} fill={he.rbc} opacity={0.8} />
          <path d={o.nuclei} fill={he.isletNucleus} />
        </g>
      ))}
    </svg>
  );
};

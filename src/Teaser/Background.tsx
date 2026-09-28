import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { colors, HEIGHT, WIDTH } from "./theme";

const PARTICLES = new Array(26).fill(0).map((_, i) => ({
  x: random(`px${i}`) * WIDTH,
  y: random(`py${i}`) * HEIGHT,
  r: 1.2 + random(`pr${i}`) * 2.2,
  speed: 0.15 + random(`ps${i}`) * 0.35,
  phase: random(`ph${i}`) * Math.PI * 2,
  alpha: 0.12 + random(`pa${i}`) * 0.25,
}));

/** Calm navy field: soft blue glows, a faint dot grid and slow dust. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = frame * 0.25;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy900 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 45% at 50% 18%, ${colors.blue700}AA 0%, transparent 70%),
            radial-gradient(ellipse 90% 40% at 50% 100%, ${colors.blue700}88 0%, transparent 70%),
            radial-gradient(ellipse 60% 30% at 85% 55%, ${colors.turquoise600}22 0%, transparent 70%)`,
        }}
      />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <defs>
          <pattern
            id="dots"
            width={48}
            height={48}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0 ${-drift % 48})`}
          >
            <circle cx={24} cy={24} r={1.4} fill={colors.textMuted} />
          </pattern>
          <radialGradient id="gridFade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="gridMask">
            <rect width={WIDTH} height={HEIGHT} fill="url(#gridFade)" />
          </mask>
        </defs>
        <rect
          width={WIDTH}
          height={HEIGHT}
          fill="url(#dots)"
          opacity={0.07}
          mask="url(#gridMask)"
        />
        {PARTICLES.map((p, i) => {
          const y = (((p.y - frame * p.speed) % HEIGHT) + HEIGHT) % HEIGHT;
          const x = p.x + Math.sin(frame / 50 + p.phase) * 14;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={p.r}
              fill={colors.turquoiseSoft}
              opacity={p.alpha * (0.6 + 0.4 * Math.sin(frame / 22 + p.phase))}
            />
          );
        })}
      </svg>
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 55%, rgba(5,14,24,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

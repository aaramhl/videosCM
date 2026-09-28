import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LENS_ORIGIN } from "./ScenePath";
import { TissueBack, TissueFloaters, TissueFront, TISSUE_EXTENT } from "./Tissue";
import { colors, easeIn, easeInOut, easeOut, fonts, lerp, radius, tween, WIDTH } from "./theme";

// Global frames. 0:08 → 0:12
const T0 = 238;
const T_OPEN = 272;
const T_CLOSE_START = 334;
const T_CLOSE_END = 356;

const CENTER = { x: WIDTH / 2, y: 960 };
const R_MAX = 440;

/** 0:08–0:12 — microscope lens opens from stop 02 onto stylised H&E tissue. */
export const SceneLens: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - T0;

  const open = tween(frame, [T0, T_OPEN], [0, 1], easeInOut);
  const close = tween(frame, [T_CLOSE_START, T_CLOSE_END], [0, 1], easeIn);
  const r = lerp(46, R_MAX, open) * (1 - close);
  const cx = lerp(LENS_ORIGIN.x, CENTER.x, open);
  const cy = lerp(LENS_ORIGIN.y, CENTER.y, open);
  if (r < 0.5) return null;

  // zoom from far-in magnification out to the field, then a slow push-in
  const zoom = lerp(3.4, 1, tween(frame, [T0, T_OPEN + 10], [0, 1], easeOut)) * (1 + tween(frame, [T_OPEN, T_CLOSE_END], [0, 0.07], easeInOut)) * (1 + close * 0.6);
  const focus = tween(frame, [T0 + 12, T_OPEN + 14], [9, 0], easeOut);

  const layer = (speedX: number, speedY: number, depthZoom: number) =>
    `translate(${-t * speedX} ${-t * speedY}) scale(${1 + (zoom - 1) * depthZoom})`;

  const chrome = tween(frame, [T0 + 10, T_OPEN], [0, 1]) * (1 - close);
  const labels = tween(frame, [T_OPEN - 4, T_OPEN + 10], [0, 1]) * tween(frame, [T_CLOSE_START - 6, T_CLOSE_START + 4], [1, 0]);

  const ticks = new Array(72).fill(0).map((_, i) => {
    const a = (i / 72) * Math.PI * 2 + t * 0.002;
    const long = i % 6 === 0;
    const r1 = r + 14;
    const r2 = r + (long ? 34 : 24);
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * r1}
        y1={cy + Math.sin(a) * r1}
        x2={cx + Math.cos(a) * r2}
        y2={cy + Math.sin(a) * r2}
        stroke={colors.turquoiseGlow}
        strokeWidth={long ? 2.5 : 1.2}
        opacity={long ? 0.8 : 0.45}
      />
    );
  });

  return (
    <AbsoluteFill>
      {/* outer glow */}
      <div
        style={{
          position: "absolute",
          left: cx - r - 80,
          top: cy - r - 80,
          width: (r + 80) * 2,
          height: (r + 80) * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.turquoise600}55 45%, transparent 70%)`,
          opacity: 0.6 + 0.4 * open,
        }}
      />

      {/* lens field */}
      <div
        style={{
          position: "absolute",
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          overflow: "hidden",
          background: colors.heBackground,
        }}
      >
        <svg
          width={TISSUE_EXTENT}
          height={TISSUE_EXTENT}
          viewBox={`${-TISSUE_EXTENT / 2} ${-TISSUE_EXTENT / 2} ${TISSUE_EXTENT} ${TISSUE_EXTENT}`}
          style={{
            position: "absolute",
            left: r - TISSUE_EXTENT / 2,
            top: r - TISSUE_EXTENT / 2,
            // focus pull: CSS blur on the whole field (SVG filters on the
            // heavily scaled groups exceed Chrome's filter texture limits)
            filter: focus > 0.05 ? `blur(${focus}px)` : undefined,
          }}
        >
          <defs>
          </defs>
          <g transform={layer(0.25, 0.12, 0.7)} opacity={0.85}>
            <TissueBack />
          </g>
          <g transform={layer(0.7, 0.32, 1)}>
            <TissueFront />
          </g>
          <g transform={layer(1.8, 0.9, 1.3)}>
            <TissueFloaters />
          </g>
        </svg>
        {/* optical vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, transparent 58%, rgba(15,36,56,0.28) 86%, rgba(15,36,56,0.75) 100%)`,
          }}
        />
        {/* faint reticle */}
        <svg width={r * 2} height={r * 2} style={{ position: "absolute", left: 0, top: 0, opacity: 0.35 * chrome }}>
          <line x1={r} y1={r * 0.35} x2={r} y2={r * 1.65} stroke={colors.navy900} strokeWidth={1} />
          <line x1={r * 0.35} y1={r} x2={r * 1.65} y2={r} stroke={colors.navy900} strokeWidth={1} />
          <circle cx={r} cy={r} r={r * 0.12} fill="none" stroke={colors.navy900} strokeWidth={1} />
        </svg>
      </div>

      {/* lens chrome */}
      <svg width={WIDTH} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.turquoiseGlow} strokeWidth={4} opacity={0.4 + 0.6 * (1 - close)} />
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={colors.turquoise600} strokeWidth={1.5} opacity={chrome} />
        <g opacity={chrome}>{ticks}</g>
        <circle cx={cx} cy={cy} r={r + 52} fill="none" stroke={colors.turquoise600} strokeWidth={1} strokeDasharray="2 10" opacity={0.7 * chrome} />
      </svg>

      {/* labels */}
      <div
        style={{
          position: "absolute",
          top: CENTER.y - R_MAX - 150,
          width: WIDTH,
          display: "flex",
          justifyContent: "center",
          opacity: labels,
          transform: `translateY(${(1 - labels) * 12}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.latin,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "0.12em",
            color: colors.turquoiseSoft,
            padding: "12px 30px",
            borderRadius: radius.pill,
            border: `1.5px solid ${colors.cardBorder}`,
            background: colors.cardFill,
          }}
        >
          H&amp;E · 40×
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: CENTER.y + R_MAX + 100,
          width: WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: labels,
        }}
      >
        <div style={{ width: 120 * labels, height: 3, background: colors.turquoiseGlow, borderRadius: 2 }} />
        <div style={{ fontFamily: fonts.latin, fontSize: 26, color: colors.textMuted, letterSpacing: "0.06em" }}>50 µm</div>
      </div>
    </AbsoluteFill>
  );
};

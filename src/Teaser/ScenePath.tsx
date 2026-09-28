import React from "react";
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon, IconKind } from "./Icons";
import {
  colors,
  easeIn,
  easeInOut,
  fonts,
  HEIGHT,
  lerp,
  mixColor,
  radius,
  tween,
  WIDTH,
} from "../shared/theme";

// All frame numbers in this file are global (scene starts at frame 0 of the video).
const T_IN = 56; // icons appear
const T_SNAP = 150; // 0:05 — icons snap onto the path
const T_MERGE = 170; // icons fold into the three stops
const T_EXIT = 238; // 0:08 — lens takes over

export const PATH_X = 880;
const PATH_TOP = 360;
const PATH_BOTTOM = 1560;
export const STOPS = [
  { y: 620, num: "٠١", title: "اختر مسارك", icon: "tabs" as IconKind },
  { y: 960, num: "٠٢", title: "تعلّم بعمق", icon: "book" as IconKind },
  { y: 1300, num: "٠٣", title: "راجع في السياق", icon: "notes" as IconKind },
];
export const LENS_ORIGIN = { x: PATH_X, y: STOPS[1].y };

const KINDS: IconKind[] = ["book", "tabs", "pdf", "notes", "notes", "pdf", "book", "tabs"];
const BASE: [number, number][] = [
  [250, 520],
  [760, 430],
  [470, 820],
  [860, 900],
  [210, 1120],
  [620, 1240],
  [330, 1520],
  [800, 1560],
];

const ICONS = KINDS.map((kind, i) => {
  const r = (k: string) => random(`${k}${i}`);
  const targetY = 470 + i * 140;
  // nearest stop (0,1,2 → 01; 3,4 → 02; 5,6,7 → 03)
  const stop = i < 3 ? 0 : i < 5 ? 1 : 2;
  return {
    kind,
    bx: BASE[i][0],
    by: BASE[i][1],
    size: 130 + r("s") * 70,
    w1: 0.018 + r("w1") * 0.02,
    w2: 0.031 + r("w2") * 0.025,
    p1: r("p1") * 6.28,
    p2: r("p2") * 6.28,
    rotAmp: 14 + r("ra") * 16,
    rot0: (r("r0") - 0.5) * 40,
    targetY,
    stop,
  };
});

const chaosPos = (ic: (typeof ICONS)[number], f: number) => ({
  x: ic.bx + 70 * Math.sin(f * ic.w1 + ic.p1) + 34 * Math.sin(f * ic.w2 * 1.7 + ic.p2),
  y: ic.by + 60 * Math.cos(f * ic.w2 + ic.p2) + 30 * Math.sin(f * ic.w1 * 2.3 + ic.p1),
  rot: ic.rot0 + ic.rotAmp * Math.sin(f * ic.w1 * 1.3 + ic.p2),
});

export const ScenePath: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneIn = tween(frame, [T_IN, T_IN + 18], [0, 1]);
  const pathDraw = tween(frame, [T_SNAP - 4, T_SNAP + 22], [0, 1], easeInOut);
  const exit = tween(frame, [T_EXIT, T_EXIT + 22], [0, 1], easeIn);

  // light pulse travelling from stop 01 to stop 02 right before the lens
  const pulseT = tween(frame, [212, 238], [0, 1], easeInOut);
  const pulseY = lerp(STOPS[0].y, STOPS[1].y, pulseT);
  const pulseOpacity = tween(frame, [212, 218], [0, 1]) * tween(frame, [238, 246], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        opacity: sceneIn * (1 - exit),
        transform: `scale(${1 + exit * 0.35})`,
        transformOrigin: `${LENS_ORIGIN.x}px ${LENS_ORIGIN.y}px`,
        filter: `blur(${exit * 6}px)`,
      }}
    >
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="pathGrad" x1="0" y1={PATH_TOP} x2="0" y2={PATH_BOTTOM} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors.turquoiseGlow} stopOpacity={0} />
            <stop offset="0.12" stopColor={colors.turquoiseGlow} stopOpacity={1} />
            <stop offset="0.88" stopColor={colors.turquoiseGlow} stopOpacity={1} />
            <stop offset="1" stopColor={colors.turquoiseGlow} stopOpacity={0} />
          </linearGradient>
          <filter id="pathGlow" x="-200%" y="-10%" width="500%" height="120%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* tangled scribbles that make the chaos feel noisy; they fade as order arrives */}
        <g opacity={0.22 * (1 - tween(frame, [T_SNAP - 6, T_SNAP + 8], [0, 1]))}>
          {ICONS.slice(0, 7).map((ic, i) => {
            const a = chaosPos(ic, frame);
            const b = chaosPos(ICONS[(i + 3) % 8], frame);
            const mx = (a.x + b.x) / 2 + 160 * Math.sin(frame / 40 + i);
            const my = (a.y + b.y) / 2 + 160 * Math.cos(frame / 47 + i * 2);
            return (
              <path
                key={i}
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                fill="none"
                stroke={colors.mutedIcon}
                strokeWidth={1.5}
                strokeDasharray="6 10"
              />
            );
          })}
        </g>

        {/* the path */}
        <g>
          <line
            x1={PATH_X}
            y1={PATH_TOP}
            x2={PATH_X}
            y2={lerp(PATH_TOP, PATH_BOTTOM, pathDraw)}
            stroke={colors.turquoiseGlow}
            strokeWidth={16}
            opacity={0.35}
            filter="url(#pathGlow)"
          />
          <line
            x1={PATH_X}
            y1={PATH_TOP}
            x2={PATH_X}
            y2={lerp(PATH_TOP, PATH_BOTTOM, pathDraw)}
            stroke="url(#pathGrad)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>

        {/* travelling pulse */}
        <circle cx={PATH_X} cy={pulseY} r={22} fill={colors.turquoiseGlow} opacity={0.3 * pulseOpacity} filter="url(#pathGlow)" />
        <circle cx={PATH_X} cy={pulseY} r={7} fill={colors.turquoiseSoft} opacity={pulseOpacity} />
      </svg>

      {/* icons: chaos → snap → merge */}
      {ICONS.map((ic, i) => {
        const c = chaosPos(ic, frame);
        const snap = spring({
          frame: frame - T_SNAP - i * 1.5,
          fps,
          config: { damping: 16, stiffness: 170, mass: 0.7 },
        });
        const merge = tween(frame, [T_MERGE + i * 0.8, T_MERGE + 12 + i * 0.8], [0, 1], easeInOut);
        const stopY = STOPS[ic.stop].y;
        const x = lerp(c.x, PATH_X, snap);
        const y = lerp(lerp(c.y, ic.targetY, snap), stopY, merge);
        const size = lerp(ic.size, 78, snap) * (1 - merge * 0.9);
        const rot = lerp(c.rot, 0, snap);
        const color = mixColor(colors.mutedIcon, colors.turquoiseGlow, Math.min(1, snap));
        const opacity = tween(frame, [T_IN + i * 2, T_IN + 14 + i * 2], [0, 1]) * (1 - merge);
        if (opacity <= 0.001) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              transform: `rotate(${rot}deg)`,
              opacity,
              filter: snap > 0.3 ? `drop-shadow(0 0 ${10 * snap}px ${colors.turquoiseGlow}88)` : undefined,
            }}
          >
            {snap > 0.2 && (
              <div
                style={{
                  position: "absolute",
                  inset: -10,
                  borderRadius: radius.card * 0.7,
                  background: colors.navy900,
                  border: `1.5px solid ${colors.cardBorder}`,
                  opacity: Math.min(1, snap),
                }}
              />
            )}
            <div style={{ position: "relative" }}>
              <Icon kind={ic.kind} size={size} color={color} strokeWidth={2.6} />
            </div>
          </div>
        );
      })}

      {/* stops + cards */}
      {STOPS.map((s, i) => {
        const pop = spring({
          frame: frame - (T_MERGE + 10 + i * 4),
          fps,
          config: { damping: 12, stiffness: 200, mass: 0.6 },
        });
        const cardStart = 182 + i * 12;
        const reveal = tween(frame, [cardStart, cardStart + 16], [0, 1]);
        const lens = i === 1 ? tween(frame, [230, 240], [0, 1]) : 0;
        return (
          <React.Fragment key={i}>
            {/* card — revealed right-to-left */}
            <div
              dir="rtl"
              style={{
                position: "absolute",
                left: 96,
                width: PATH_X - 96 - 86,
                top: s.y - 88,
                height: 176,
                borderRadius: radius.card,
                background: colors.cardFill,
                border: `1.5px solid ${colors.cardBorder}`,
                boxShadow: `0 18px 40px rgba(3,10,20,0.35)`,
                clipPath: `inset(0 0 0 ${(1 - reveal) * 100}% round ${radius.card}px)`,
                opacity: tween(frame, [cardStart, cardStart + 6], [0, 1]),
                transform: `translateX(${(1 - reveal) * 40}px)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 48px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontFamily: fonts.arabic,
                  fontWeight: 700,
                  fontSize: 64,
                  color: colors.text,
                  opacity: tween(frame, [cardStart + 6, cardStart + 16], [0, 1]),
                  transform: `translateX(${tween(frame, [cardStart + 6, cardStart + 18], [-18, 0])}px)`,
                }}
              >
                {s.title}
              </div>
              <div style={{ opacity: 0.8 * tween(frame, [cardStart + 10, cardStart + 20], [0, 1]) }}>
                <Icon kind={s.icon} size={64} color={colors.turquoiseGlow} strokeWidth={2.4} />
              </div>
            </div>
            {/* connector */}
            <div
              style={{
                position: "absolute",
                left: PATH_X - 86,
                top: s.y - 1,
                width: 86 * reveal,
                height: 2,
                background: colors.cardBorder,
              }}
            />
            {/* node */}
            <div
              style={{
                position: "absolute",
                left: PATH_X - 50,
                top: s.y - 50,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: mixColor(colors.blue700, colors.turquoise600, lens),
                border: `3px solid ${colors.turquoiseGlow}`,
                boxShadow: `0 0 ${24 + 30 * lens}px ${colors.turquoiseGlow}${lens > 0 ? "cc" : "77"}`,
                transform: `scale(${pop})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.arabic,
                fontWeight: 700,
                fontSize: 40,
                color: colors.text,
                boxSizing: "border-box",
                paddingBottom: 4,
              }}
            >
              {s.num}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { LogoMark, Wordmark } from "./Logo";
import { colors, easeIn, easeInOut, fonts, HEIGHT, tween, WIDTH } from "../shared/theme";

const CX = WIDTH / 2;
const CY = 800;
const MARK = 300;
const RING_R = (88 / 200) * MARK;

const LINES = new Array(18).fill(0).map((_, i) => {
  const angle = (i / 18) * Math.PI * 2 + (random(`la${i}`) - 0.5) * 0.3;
  return {
    angle,
    delay: random(`ld${i}`) * 8,
    len: 220 + random(`ll${i}`) * 260,
    width: 1.2 + random(`lw${i}`) * 1.6,
    start: 1150 + random(`ls${i}`) * 350,
  };
});

/** 0:00–0:02 — light lines converge into the logo and the tagline. */
export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();

  const ring = tween(frame, [18, 34], [0, 1], easeInOut);
  const book = tween(frame, [24, 40], [0, 1], easeInOut);
  const spine = tween(frame, [30, 42], [0, 1], easeInOut);
  const glow = tween(frame, [26, 34], [0, 1]) * tween(frame, [34, 56], [1, 0.15]);

  const wordOpacity = tween(frame, [34, 48], [0, 1]);
  const wordTracking = tween(frame, [34, 56], [0.12, 0]);
  const tagOpacity = tween(frame, [42, 54], [0, 1]);
  const tagY = tween(frame, [42, 56], [22, 0]);

  // hand-off to the chaos scene
  const exit = tween(frame, [56, 68], [0, 1], easeIn);

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <defs>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={colors.turquoise600} stopOpacity={0} />
            <stop offset="1" stopColor={colors.turquoiseSoft} stopOpacity={1} />
          </linearGradient>
        </defs>
        <g filter="url(#lineGlow)">
          {LINES.map((l, i) => {
            const t = tween(frame, [l.delay, 26 + l.delay * 0.4], [0, 1], easeInOut);
            const head = l.start + (RING_R - l.start) * t;
            const len = l.len * (1 - t);
            const tail = head + len;
            if (len < 1) return null;
            const cos = Math.cos(l.angle);
            const sin = Math.sin(l.angle);
            const opacity = tween(frame, [l.delay, l.delay + 6], [0, 0.9]);
            return (
              <line
                key={i}
                x1={CX + cos * tail}
                y1={CY + sin * tail}
                x2={CX + cos * head}
                y2={CY + sin * head}
                stroke={colors.turquoiseGlow}
                strokeWidth={l.width}
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}
        </g>
        {/* arrival flash */}
        <circle
          cx={CX}
          cy={CY}
          r={RING_R + tween(frame, [26, 50], [0, 140])}
          fill="none"
          stroke={colors.turquoiseGlow}
          strokeWidth={2}
          opacity={tween(frame, [26, 30], [0, 0.6]) * tween(frame, [30, 50], [1, 0])}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: CX - MARK / 2,
          top: CY - MARK / 2,
        }}
      >
        <LogoMark size={MARK} ring={ring} book={book} spine={spine} glow={glow} />
      </div>

      <div
        style={{
          position: "absolute",
          top: CY + MARK / 2 + 56,
          width: WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Wordmark fontSize={84} opacity={wordOpacity} tracking={wordTracking} />
        <div
          dir="rtl"
          style={{
            fontFamily: fonts.arabic,
            fontSize: 58,
            fontWeight: 500,
            color: colors.textMuted,
            opacity: tagOpacity,
            transform: `translateY(${tagY}px)`,
          }}
        >
          المعرفة في مسارها.
        </div>
      </div>
    </AbsoluteFill>
  );
};

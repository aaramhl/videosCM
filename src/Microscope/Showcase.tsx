import "../shared/fonts";
import React from "react";
import { AbsoluteFill, Audio, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../shared/Background";
import { colors, easeIn, easeInOut, fonts, lerp, radius, tween } from "../shared/theme";
import { Viewer } from "./Viewer";

export const SHOWCASE_DURATION = 25 * 30;

const Logo: React.FC<{ size: number; glow?: number }> = ({ size, glow = 0 }) => (
  // The supplied logo file, shown unaltered (only scaled uniformly). Its own
  // light background forms the tile; the corners are rounded by the frame.
  <Img
    src={staticFile("canonmedicinae-logo.jpg")}
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.1,
      display: "block",
      boxShadow: `0 24px 60px rgba(3,10,20,0.5), 0 0 ${30 + glow * 40}px rgba(63,194,204,${0.15 + glow * 0.3})`,
    }}
  />
);

/** 0:00–0:03 */
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = tween(frame, [4, 30], [0, 1]);
  const ar = tween(frame, [28, 46], [0, 1]);
  const en = tween(frame, [38, 56], [0, 1]);
  const exit = tween(frame, [80, 98], [0, 1], easeIn);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        transform: `translateY(${-exit * 60}px)`,
        alignItems: "center",
        paddingTop: 470,
      }}
    >
      <div style={{ opacity: logo, transform: `scale(${0.94 + 0.06 * logo})` }}>
        <Logo size={420} />
      </div>
      <div
        dir="rtl"
        style={{
          marginTop: 70,
          fontFamily: fonts.arabic,
          fontWeight: 700,
          fontSize: 96,
          color: colors.text,
          opacity: ar,
          transform: `translateY(${(1 - ar) * 20}px)`,
        }}
      >
        المجهر الافتراضي
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: fonts.latin,
          fontWeight: 400,
          fontSize: 52,
          letterSpacing: "0.02em",
          color: colors.turquoiseSoft,
          opacity: en,
          transform: `translateY(${(1 - en) * 16}px)`,
        }}
      >
        Virtual Microscope
      </div>
    </AbsoluteFill>
  );
};

const CAPTIONS = ["شرائح نسيجية حقيقية عالية الدقة", "تكبير وتنقل حر داخل الشريحة", "معالم تعليمية على البنى المهمة"];

/** 0:18–0:22 — numbered captions beside (below) the docked viewer. */
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1150, display: "flex", flexDirection: "column", gap: 26 }}>
      {CAPTIONS.map((text, i) => {
        const t0 = 548 + i * 36;
        const p = tween(frame, [t0, t0 + 18], [0, 1]);
        const num = tween(frame, [t0 + 4, t0 + 16], [0, 1]);
        return (
          <div
            key={i}
            dir="rtl"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              padding: "22px 30px",
              borderRadius: radius.card,
              background: colors.cardFill,
              border: `1.5px solid ${colors.cardBorder}`,
              opacity: p,
              transform: `translateX(${(1 - p) * 60}px)`,
            }}
          >
            <div
              style={{
                flex: "0 0 auto",
                width: 76,
                height: 76,
                borderRadius: "50%",
                border: `3px solid ${colors.turquoiseGlow}`,
                background: colors.turquoise600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.latin,
                fontWeight: 700,
                fontSize: 36,
                color: colors.text,
                transform: `scale(${0.6 + 0.4 * num})`,
                boxShadow: `0 0 20px ${colors.turquoiseGlow}66`,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontFamily: fonts.arabic, fontWeight: 600, fontSize: 46, color: colors.text }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
};

/** 0:22–0:25 */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = frame - 664;
  const logo = spring({ frame: l, fps, config: { damping: 18, stiffness: 110 } });
  const underline = tween(l, [18, 40], [0, 1], easeInOut);
  const shimmer = tween(l, [34, 58], [-0.3, 1.3]);
  const url = tween(l, [36, 50], [0, 1]);
  const invite = tween(l, [46, 60], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 520 }}>
      <div style={{ opacity: logo, transform: `scale(${0.9 + 0.1 * logo})` }}>
        <Logo size={380} glow={tween(l, [14, 30], [0, 1]) * tween(l, [30, 60], [1, 0.3])} />
      </div>
      <div style={{ position: "relative", marginTop: 56, width: 380, height: 6 }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            height: 6,
            width: 380 * underline,
            transform: "translateX(-50%)",
            borderRadius: 3,
            background: `linear-gradient(90deg, transparent, ${colors.turquoise600} 15%, ${colors.turquoiseGlow} 50%, ${colors.turquoise600} 85%, transparent)`,
            boxShadow: `0 0 18px ${colors.turquoiseGlow}88`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shimmer * 100}%`,
              width: 80,
              background: `linear-gradient(90deg, transparent, ${colors.turquoiseSoft}, transparent)`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          marginTop: 64,
          fontFamily: fonts.latin,
          fontWeight: 600,
          fontSize: 56,
          color: colors.text,
          opacity: url,
          transform: `translateY(${(1 - url) * 16}px)`,
        }}
      >
        canonmedicinae.com
      </div>
      <div
        dir="rtl"
        style={{
          marginTop: 14,
          fontFamily: fonts.arabic,
          fontWeight: 500,
          fontSize: 36,
          color: colors.textMuted,
          opacity: invite,
          transform: `translateY(${(1 - invite) * 12}px)`,
        }}
      >
        نسخة تجريبية بالدعوات
      </div>
    </AbsoluteFill>
  );
};

export const Showcase: React.FC = () => {
  const frame = useCurrentFrame();
  // 0:18 — the viewer docks upward to make room for the captions
  const dock = tween(frame, [526, 556], [0, 1], easeInOut);
  const demoExit = tween(frame, [650, 668], [0, 1], easeIn);
  const fadeOut = tween(frame, [726, 750], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy900 }}>
      <Background />
      {frame < 100 && <Intro />}
      {frame >= 88 && frame < 670 && (
        <AbsoluteFill style={{ opacity: 1 - demoExit, transform: `scale(${1 - demoExit * 0.03})` }}>
          <AbsoluteFill
            style={{
              transform: `translateY(${lerp(0, -170, dock)}px) scale(${lerp(1, 0.8, dock)})`,
              transformOrigin: "540px 300px",
            }}
          >
            <Viewer />
          </AbsoluteFill>
          {frame >= 540 && <Captions />}
        </AbsoluteFill>
      )}
      {frame >= 660 && <Outro />}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut }} />
      <Audio src={staticFile("music-microscope.wav")} />
    </AbsoluteFill>
  );
};

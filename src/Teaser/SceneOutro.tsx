import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, Wordmark } from "./Logo";
import { colors, easeInOut, fonts, radius, tween, WIDTH } from "./theme";

// Global frames. 0:12 → 0:15
const T0 = 350;

/** 0:12–0:15 — logo returns, underline, tagline, URL. (Fade to black lives in Teaser.) */
export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = frame - T0;

  const logoIn = spring({ frame: l, fps, config: { damping: 18, stiffness: 120 } });
  const draw = tween(l, [0, 16], [0, 1], easeInOut);
  const underline = tween(l, [14, 32], [0, 1], easeInOut);
  const shimmer = tween(l, [26, 46], [-0.3, 1.3]);
  const ar = tween(l, [28, 40], [0, 1]);
  const en = tween(l, [36, 48], [0, 1]);
  const url = tween(l, [48, 60], [0, 1]);
  const invite = tween(l, [56, 68], [0, 1]);

  const rise = (p: number) => `translateY(${(1 - p) * 20}px)`;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 430,
          width: WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ opacity: logoIn, transform: `scale(${0.85 + 0.15 * logoIn})` }}>
          <LogoMark size={250} ring={draw} book={draw} spine={draw} glow={tween(l, [10, 18], [0, 0.7]) * tween(l, [18, 40], [1, 0.2])} />
        </div>
        <div style={{ marginTop: 48, opacity: logoIn, transform: rise(logoIn) }}>
          <Wordmark fontSize={80} opacity={1} />
        </div>
        {/* animated underline */}
        <div style={{ position: "relative", marginTop: 22, width: 560, height: 6 }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              height: 5,
              width: 560 * underline,
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
                width: 90,
                background: `linear-gradient(90deg, transparent, ${colors.turquoiseSoft}, transparent)`,
              }}
            />
          </div>
        </div>

        <div
          dir="rtl"
          style={{
            marginTop: 90,
            fontFamily: fonts.arabic,
            fontWeight: 700,
            fontSize: 70,
            color: colors.text,
            opacity: ar,
            transform: rise(ar),
          }}
        >
          من المعرفة إلى طبيب أفضل
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.latin,
            fontWeight: 400,
            fontSize: 44,
            letterSpacing: "0.01em",
            color: colors.textMuted,
            opacity: en,
            transform: rise(en),
          }}
        >
          Knowledge Builds Better Doctors
        </div>

        <div
          style={{
            marginTop: 170,
            padding: "26px 56px",
            borderRadius: radius.card,
            background: colors.cardFill,
            border: `1.5px solid ${colors.cardBorder}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: url,
            transform: rise(url),
          }}
        >
          <div style={{ fontFamily: fonts.latin, fontWeight: 600, fontSize: 50, color: colors.turquoiseSoft, letterSpacing: "0.01em" }}>
            canonmedicinae.com
          </div>
          <div
            dir="rtl"
            style={{ fontFamily: fonts.arabic, fontWeight: 500, fontSize: 34, color: colors.textMuted, opacity: invite, transform: rise(invite) }}
          >
            نسخة تجريبية بالدعوات
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
